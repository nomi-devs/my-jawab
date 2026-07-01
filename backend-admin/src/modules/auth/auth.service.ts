import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { PrismaService } from '../../prisma/prisma.service';
import { DeviceType as PrismaDeviceType } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EmailTemplatesService } from '../email/services/email-templates.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private emailTemplatesService: EmailTemplatesService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  private googleClient: OAuth2Client;

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(user: {
    id: number;
    username: string;
    role: string;
  }) {
    const payload = { sub: user.id, username: user.username, role: user.role };

    // Access token: 1 month (30 days)
    const accessTokenExpiresIn = '30d'; // 1 month
    const accessTokenExpiresInSeconds = 30 * 24 * 60 * 60; // 2,592,000 seconds

    // Refresh token: 3 months (90 days)
    const refreshTokenExpiresIn = '90d'; // 3 months

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });

    // Invalidate cache when user data changes
    await this.invalidateUserCache(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: accessTokenExpiresInSeconds, // Return in seconds for API response
    };
  }

  async invalidateUserCache(userId: number): Promise<void> {
    const cacheKey = `user:${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  private async verifyGoogleToken(token: string): Promise<string> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

      if (!clientId) {
        this.logger.error(
          'GOOGLE_CLIENT_ID is not configured in environment variables',
        );
        throw new UnauthorizedException(
          'Google OAuth is not properly configured',
        );
      }

      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        this.logger.error('Google token payload missing email');
        throw new UnauthorizedException('Invalid Google token');
      }
      return payload.email;
    } catch (error) {
      this.logger.error('Google token verification failed:', {
        error: error.message,
        stack: error.stack,
        clientIdConfigured:
          !!this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private async verifyAppleToken(token: string): Promise<string> {
    try {
      const clientId = this.configService.get<string>('APPLE_CLIENT_ID');

      if (!clientId) {
        this.logger.error(
          'APPLE_CLIENT_ID is not configured in environment variables',
        );
        throw new UnauthorizedException(
          'Apple OAuth is not properly configured',
        );
      }

      const { email } = await appleSignin.verifyIdToken(token, {
        audience: clientId,
      });

      if (!email) {
        // In some cases Apple might not return email on subsequent logins if not requested properly,
        // but for initial registration/login we expect it or we need to handle sub matching.
        // For now, let's assume we need email to match/create user.
        this.logger.error('Apple token payload missing email');
        throw new UnauthorizedException('Email not found in Apple token');
      }
      return email;
    } catch (error) {
      this.logger.error('Apple token verification failed:', {
        error: error.message,
        stack: error.stack,
        clientIdConfigured: !!this.configService.get<string>('APPLE_CLIENT_ID'),
      });
      throw new UnauthorizedException('Invalid Apple token');
    }
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Validate OAuth token first
    if (this.isOAuth(registerDto.auth_type)) {
      if (!registerDto.oauth_token) {
        throw new BadRequestException('OAuth token is required');
      }
      let email: string;
      if (registerDto.auth_type === 'google') {
        email = await this.verifyGoogleToken(registerDto.oauth_token);
      } else {
        email = await this.verifyAppleToken(registerDto.oauth_token);
      }

      if (email !== registerDto.email) {
        throw new UnauthorizedException(
          'Token email does not match provided email',
        );
      }
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: registerDto.email }, { username: registerDto.username }],
      },
      select: { id: true, is_deleted: true },
    });

    if (existingUser) {
      if (existingUser.is_deleted) {
        // Deleted users cannot register again with the same identifier.
        // Admin must hard-delete the record if they want to free up the email/username.
        throw new ConflictException(
          'You cannot create an account with this email or username. Please contact support.',
        );
      }
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (
      registerDto.password &&
      (registerDto.auth_type === 'email' || registerDto.auth_type === 'phone')
    ) {
      passwordHash = await bcrypt.hash(registerDto.password, 10);
    }

    const isOAuthUser =
      registerDto.auth_type === 'google' || registerDto.auth_type === 'apple';

    // Create user
    const savedUser = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        password_hash: passwordHash,
        auth_type: registerDto.auth_type,
        is_active: isOAuthUser,
        is_verified: isOAuthUser,
      },
    });

    // Generate verification code for email/phone auth
    if (
      registerDto.auth_type === 'email' ||
      registerDto.auth_type === 'phone'
    ) {
      const verificationCode = this.generateVerificationCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

      await this.prisma.userVerification.create({
        data: {
          user_id: savedUser.id,
          verification_code: verificationCode,
          expires_at: expiresAt,
          is_used: false,
        },
      });

      // Send verification email with template
      try {
        const appUrl = this.configService.get<string>(
          'app.url',
          'https://demo.jantrah.com/jawaab',
        );
        const verificationUrl = `${appUrl}/verify?code=${verificationCode}&email=${encodeURIComponent(savedUser.email)}`;

        const emailSent =
          await this.emailTemplatesService.sendVerificationEmail({
            recipientEmail: savedUser.email,
            recipientName: savedUser.username,
            verificationCode,
            verificationUrl,
          });

        if (emailSent) {
          this.logger.log(
            `Verification email sent successfully to ${savedUser.email}`,
          );
        } else {
          this.logger.warn(
            `Verification email failed to send to ${savedUser.email} - check email service configuration`,
          );
        }
      } catch (error) {
        this.logger.error('Failed to send verification email:', {
          error: error.message,
          stack: error.stack,
          email: savedUser.email,
          verificationCode: verificationCode,
        });
        // Log code for development (remove in production)
        if (this.configService.get<string>('NODE_ENV') === 'development') {
          console.log(
            `Verification code for ${savedUser.email}: ${verificationCode}`,
          );
        }
      }

      // Send welcome email
      try {
        await this.emailTemplatesService.sendAccountCreationEmail({
          recipientEmail: savedUser.email,
          recipientName: savedUser.username,
          username: savedUser.username,
          verificationCode,
        });
      } catch (error) {
        this.logger.error('Failed to send welcome email:', error);
      }
    }

    // Register device if provided
    if (registerDto.device_id) {
      await this.registerDevice(savedUser.id, {
        device_id: registerDto.device_id,
        device_type: registerDto.device_type || 'web',
        device_token: registerDto.device_token,
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role as any,
        auth_type: savedUser.auth_type as any,
        is_active: savedUser.is_active,
        is_verified: savedUser.is_verified,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by identifier (email or username)
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: loginDto.identifier }, { username: loginDto.identifier }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        password_hash: true,
        role: true,
        auth_type: true,
        is_active: true,
        is_verified: true,
        is_deleted: true,
        expires_in: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Block login for soft-deleted users
    if (user.is_deleted) {
      throw new UnauthorizedException(
        'This account has been deleted. You cannot log in. Please contact support if this is a mistake.',
      );
    }

    // Verify OAuth token
    if (this.isOAuth(loginDto.auth_type)) {
      if (!loginDto.oauth_token) {
        throw new BadRequestException('OAuth token is required');
      }

      let email: string;
      if (loginDto.auth_type === 'google') {
        email = await this.verifyGoogleToken(loginDto.oauth_token);
      } else {
        email = await this.verifyAppleToken(loginDto.oauth_token);
      }

      if (email !== user.email) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Verify password for email/phone auth
    if (loginDto.auth_type === 'email' || loginDto.auth_type === 'phone') {
      if (!loginDto.password || !user.password_hash) {
        throw new UnauthorizedException('Password is required');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException(
        'Your account has been inactive.. If you want to reactivate it, please contact support.',
      );
    }

    // Check if user is verified (for email/phone auth)
    if (
      (loginDto.auth_type === 'email' || loginDto.auth_type === 'phone') &&
      !user.is_verified
    ) {
      throw new UnauthorizedException('Please verify your account first');
    }

    // Register/update device if provided
    if (loginDto.device_id) {
      await this.registerDevice(user.id, {
        device_id: loginDto.device_id,
        device_type: loginDto.device_type || 'web',
        device_token: loginDto.device_token,
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as any,
        auth_type: user.auth_type as any,
        is_active: user.is_active,
        is_verified: user.is_verified,
      },
      ...tokens,
    };
  }

  async verify(verifyDto: VerifyDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: verifyDto.email },
      select: { id: true, is_verified: true, is_active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_verified) {
      throw new BadRequestException('User is already verified');
    }

    const verification = await this.prisma.userVerification.findFirst({
      where: {
        user_id: user.id,
        verification_code: verifyDto.verification_code,
        is_used: false,
        expires_at: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Mark verification as used
    await this.prisma.userVerification.update({
      where: { id: verification.id },
      data: { is_used: true },
    });

    // Mark user as verified and active
    await this.prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true, is_active: true },
    });

    // Invalidate cache when user status changes
    await this.invalidateUserCache(user.id);

    return { message: 'Account verified successfully' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true, is_verified: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_verified) {
      throw new BadRequestException('User is already verified');
    }

    const verificationCode = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.prisma.userVerification.create({
      data: {
        user_id: user.id,
        verification_code: verificationCode,
        expires_at: expiresAt,
        is_used: false,
      },
    });

    // Send verification email with template
    try {
      const appUrl = this.configService.get<string>(
        'app.url',
        'https://demo.jantrah.com/jawaab',
      );
      const verificationUrl = `${appUrl}/verify?code=${verificationCode}&email=${encodeURIComponent(user.email)}`;

      await this.emailTemplatesService.sendVerificationEmail({
        recipientEmail: user.email,
        recipientName: user.email,
        verificationCode,
        verificationUrl,
      });
    } catch (error) {
      this.logger.error('Failed to send verification email:', error);
      // Log code for development (remove in production)
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        console.log(`Verification code for ${user.email}: ${verificationCode}`);
      }
    }

    return { message: 'Verification code sent successfully' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    // Validate at least one identifier is provided
    // Values are already trimmed by @Transform decorator
    const email =
      forgotPasswordDto.email && forgotPasswordDto.email.length > 0
        ? forgotPasswordDto.email
        : null;
    const phone =
      forgotPasswordDto.phone_number &&
      forgotPasswordDto.phone_number.length > 0
        ? forgotPasswordDto.phone_number
        : null;

    if (!email && !phone) {
      throw new BadRequestException(
        'Either email or phone_number must be provided',
      );
    }

    // Build where condition - prioritize email, then phone (by username)
    const whereCondition: any = {};
    if (email) {
      whereCondition.email = email;
    } else if (phone) {
      whereCondition.username = phone;
    }

    // Find user by email or username (phone)
    const user = await this.prisma.user.findFirst({
      where: whereCondition,
      select: { id: true, email: true },
    });

    if (!user) {
      // Don't reveal if user exists or not for security (matching admin pattern)
      return {
        message:
          'If the email or phone exists, a password reset code has been sent',
      };
    }

    const resetCode = this.generateResetCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await this.prisma.userPasswordReset.create({
      data: {
        user_id: user.id,
        email: email || null,
        phone_number: phone || null,
        reset_code: resetCode,
        expires_at: expiresAt,
        is_used: false,
      },
    });

    // Send password reset email with template (only if email is provided)
    if (email && user.email) {
      try {
        const appUrl = this.configService.get<string>(
          'app.url',
          'https://demo.jantrah.com/jawaab',
        );
        const resetUrl = `${appUrl}/reset-password?code=${resetCode}&email=${encodeURIComponent(user.email)}`;

        await this.emailTemplatesService.sendPasswordResetEmail({
          recipientEmail: user.email,
          recipientName: user.email,
          resetCode,
          resetUrl,
        });
      } catch (error) {
        this.logger.error('Failed to send password reset email:', error);
        // Log code for development (remove in production)
        if (this.configService.get<string>('NODE_ENV') === 'development') {
          console.log(`Reset code for ${email}: ${resetCode}`);
        }
      }
    } else if (phone) {
      // For phone-based reset, log code (SMS integration would go here)
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        console.log(`Reset code for ${phone}: ${resetCode}`);
      }
    }

    return {
      message:
        'If the email or phone exists, a password reset code has been sent',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Validate at least one identifier is provided
    // Values are already trimmed by @Transform decorator
    const email =
      resetPasswordDto.email && resetPasswordDto.email.length > 0
        ? resetPasswordDto.email
        : null;
    const phone =
      resetPasswordDto.phone_number && resetPasswordDto.phone_number.length > 0
        ? resetPasswordDto.phone_number
        : null;

    if (!email && !phone) {
      throw new BadRequestException(
        'Either email or phone_number must be provided',
      );
    }

    // Build where condition - prioritize email, then phone (by username)
    const whereCondition: any = {};
    if (email) {
      whereCondition.email = email;
    } else if (phone) {
      whereCondition.username = phone;
    }

    // Find user by email or username (phone)
    const user = await this.prisma.user.findFirst({
      where: whereCondition,
      select: { id: true, password_hash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordReset = await this.prisma.userPasswordReset.findFirst({
      where: {
        user_id: user.id,
        reset_code: resetPasswordDto.reset_code,
        is_used: false,
        expires_at: { gt: new Date() },
      },
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Mark reset code as used
    await this.prisma.userPasswordReset.update({
      where: { id: passwordReset.id },
      data: { is_used: true },
    });

    // Update password
    const passwordHash = await bcrypt.hash(resetPasswordDto.new_password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password_hash: passwordHash },
    });

    // Invalidate cache when password changes
    await this.invalidateUserCache(user.id);

    return { message: 'Password reset successfully' };
  }

  async logout(userId: number): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, access_token: true, refresh_token: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Clear tokens
    await this.prisma.user.update({
      where: { id: userId },
      data: { access_token: null, refresh_token: null },
    });

    // Invalidate cache
    await this.invalidateUserCache(userId);

    return { message: 'Logged out successfully' };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refresh_token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          auth_type: true,
          is_active: true,
          is_verified: true,
          refresh_token: true,
          expires_in: true,
        },
      });

      if (!user || user.refresh_token !== refreshTokenDto.refresh_token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!user.is_active) {
        throw new UnauthorizedException(
          'Your account has been inactive.. If you want to reactivate it, please contact support.',
        );
      }

      const tokens = await this.generateTokens(user);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role as any,
          auth_type: user.auth_type as any,
          is_active: user.is_active,
          is_verified: user.is_verified,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async registerDevice(
    userId: number,
    deviceData: {
      device_id: string;
      device_type: string;
      device_token?: string;
    },
  ): Promise<any> {
    const deviceType = deviceData.device_type as PrismaDeviceType;
    return await this.prisma.userDevice.upsert({
      where: {
        user_id_device_id: {
          user_id: userId,
          device_id: deviceData.device_id,
        },
      },
      create: {
        user_id: userId,
        device_id: deviceData.device_id,
        device_type: deviceType,
        device_token: deviceData.device_token ?? null,
        is_active: true,
        last_active_at: new Date(),
      },
      update: {
        device_token: deviceData.device_token ?? undefined,
        device_type: deviceType,
        is_active: true,
        last_active_at: new Date(),
      },
    });
  }

  private isOAuth(authType: string): boolean {
    return authType === 'google' || authType === 'apple';
  }
}
