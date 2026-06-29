import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { User, AuthType } from './entities/user.entity';
import { UserVerification } from './entities/user-verification.entity';
import { UserPasswordReset } from './entities/user-password-reset.entity';
import { UserDevice, DeviceType } from './entities/user-device.entity';
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
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserVerification)
    private verificationRepository: Repository<UserVerification>,
    @InjectRepository(UserPasswordReset)
    private passwordResetRepository: Repository<UserPasswordReset>,
    @InjectRepository(UserDevice)
    private deviceRepository: Repository<UserDevice>,
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

  private async generateTokens(user: User) {
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

    user.access_token = accessToken;
    user.refresh_token = refreshToken;
    await this.userRepository.save(user);

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
        this.logger.error('GOOGLE_CLIENT_ID is not configured in environment variables');
        throw new UnauthorizedException('Google OAuth is not properly configured');
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
        clientIdConfigured: !!this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private async verifyAppleToken(token: string): Promise<string> {
    try {
      const clientId = this.configService.get<string>('APPLE_CLIENT_ID');

      if (!clientId) {
        this.logger.error('APPLE_CLIENT_ID is not configured in environment variables');
        throw new UnauthorizedException('Apple OAuth is not properly configured');
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
    // Check if user already exists (optimized: select only id for existence check)
    // Validate OAuth token first
    if (this.isOAuth(registerDto.auth_type)) {
      if (!registerDto.oauth_token) {
        throw new BadRequestException('OAuth token is required');
      }
      let email: string;
      if (registerDto.auth_type === AuthType.GOOGLE) {
        email = await this.verifyGoogleToken(registerDto.oauth_token);
      } else {
        email = await this.verifyAppleToken(registerDto.oauth_token);
      }

      if (email !== registerDto.email) {
        throw new UnauthorizedException('Token email does not match provided email');
      }
    }

    const existingUser = await this.userRepository.findOne({
      where: [
        { email: registerDto.email },
        { username: registerDto.username },
      ],
      select: ['id', 'is_deleted'],
    });

    if (existingUser) {
      if (existingUser.is_deleted) {
        // Deleted users cannot register again with the same identifier.
        // Admin must hard-delete the record if they want to free up the email/username.
        throw new ConflictException(
          'You cannot create an account with this email or username. Please contact support.',
        );
      }
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (registerDto.password && (registerDto.auth_type === AuthType.EMAIL || registerDto.auth_type === AuthType.PHONE)) {
      passwordHash = await bcrypt.hash(registerDto.password, 10);
    }

    // Create user
    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password_hash: passwordHash,
      auth_type: registerDto.auth_type,
      is_active: registerDto.auth_type === AuthType.GOOGLE || registerDto.auth_type === AuthType.APPLE ? true : false,
      is_verified: registerDto.auth_type === AuthType.GOOGLE || registerDto.auth_type === AuthType.APPLE ? true : false,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate verification code for email/phone auth
    if (registerDto.auth_type === AuthType.EMAIL || registerDto.auth_type === AuthType.PHONE) {
      const verificationCode = this.generateVerificationCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

      await this.verificationRepository.save({
        user_id: savedUser.id,
        verification_code: verificationCode,
        expires_at: expiresAt,
        is_used: false,
      });

      // Send verification email with template
      try {
        const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');
        const verificationUrl = `${appUrl}/verify?code=${verificationCode}&email=${encodeURIComponent(savedUser.email)}`;

        const emailSent = await this.emailTemplatesService.sendVerificationEmail({
          recipientEmail: savedUser.email,
          recipientName: savedUser.username,
          verificationCode,
          verificationUrl,
        });

        if (emailSent) {
          this.logger.log(`Verification email sent successfully to ${savedUser.email}`);
        } else {
          this.logger.warn(`Verification email failed to send to ${savedUser.email} - check email service configuration`);
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
          console.log(`Verification code for ${savedUser.email}: ${verificationCode}`);
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
        device_type: registerDto.device_type as DeviceType || DeviceType.WEB,
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
        role: savedUser.role,
        auth_type: savedUser.auth_type,
        is_active: savedUser.is_active,
        is_verified: savedUser.is_verified,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by identifier (email, username, or phone)
    // Optimized: select only needed fields
    const user = await this.userRepository.findOne({
      where: [
        { email: loginDto.identifier },
        { username: loginDto.identifier },
      ],
      select: [
        'id',
        'username',
        'email',
        'password_hash',
        'role',
        'auth_type',
        'is_active',
        'is_verified',
        'is_deleted',
        'expires_in',
      ],
    });

    if (!user) {
      // If OAuth, and user doesn't exist, we might want to throw specific error or handle differently?
      // Standard flow says invalid credentials.
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
      if (loginDto.auth_type === AuthType.GOOGLE) {
        email = await this.verifyGoogleToken(loginDto.oauth_token);
      } else {
        email = await this.verifyAppleToken(loginDto.oauth_token);
      }

      if (email !== user.email) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Verify password for email/phone auth
    if (loginDto.auth_type === AuthType.EMAIL || loginDto.auth_type === AuthType.PHONE) {
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
      throw new UnauthorizedException('Your account has been inactive.. If you want to reactivate it, please contact support.');
    }

    // Check if user is verified (for email/phone auth)
    if ((loginDto.auth_type === AuthType.EMAIL || loginDto.auth_type === AuthType.PHONE) && !user.is_verified) {
      throw new UnauthorizedException('Please verify your account first');
    }

    // Register/update device if provided
    if (loginDto.device_id) {
      await this.registerDevice(user.id, {
        device_id: loginDto.device_id,
        device_type: loginDto.device_type as DeviceType || DeviceType.WEB,
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
        role: user.role,
        auth_type: user.auth_type,
        is_active: user.is_active,
        is_verified: user.is_verified,
      },
      ...tokens,
    };
  }

  async verify(verifyDto: VerifyDto): Promise<{ message: string }> {
    // Optimized: select only needed fields
    const user = await this.userRepository.findOne({
      where: { email: verifyDto.email },
      select: ['id', 'is_verified', 'is_active'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_verified) {
      throw new BadRequestException('User is already verified');
    }

    const verification = await this.verificationRepository.findOne({
      where: {
        user_id: user.id,
        verification_code: verifyDto.verification_code,
        is_used: false,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Mark verification as used
    verification.is_used = true;
    await this.verificationRepository.save(verification);

    // Mark user as verified and active
    user.is_verified = true;
    user.is_active = true;
    await this.userRepository.save(user);

    // Invalidate cache when user status changes
    await this.invalidateUserCache(user.id);

    return { message: 'Account verified successfully' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    // Optimized: select only needed fields
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'is_verified', 'email'],
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

    await this.verificationRepository.save({
      user_id: user.id,
      verification_code: verificationCode,
      expires_at: expiresAt,
      is_used: false,
    });

    // Send verification email with template
    try {
      const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    // Validate at least one identifier is provided
    // Values are already trimmed by @Transform decorator
    const email = forgotPasswordDto.email && forgotPasswordDto.email.length > 0
      ? forgotPasswordDto.email
      : null;
    const phone = forgotPasswordDto.phone_number && forgotPasswordDto.phone_number.length > 0
      ? forgotPasswordDto.phone_number
      : null;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone_number must be provided');
    }

    // Build where condition - prioritize email, then phone (by username)
    const whereCondition: any = {};
    if (email) {
      whereCondition.email = email;
    } else if (phone) {
      whereCondition.username = phone;
    }

    // Find user by email or username (phone)
    const user = await this.userRepository.findOne({
      where: whereCondition,
      select: ['id', 'email'],
    });

    if (!user) {
      // Don't reveal if user exists or not for security (matching admin pattern)
      return { message: 'If the email or phone exists, a password reset code has been sent' };
    }

    const resetCode = this.generateResetCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await this.passwordResetRepository.save({
      user_id: user.id,
      email: email || null,
      phone_number: phone || null,
      reset_code: resetCode,
      expires_at: expiresAt,
      is_used: false,
    });

    // Send password reset email with template (only if email is provided)
    if (email && user.email) {
      try {
        const appUrl = this.configService.get<string>('app.url', 'https://demo.jantrah.com/jawaab');
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

    return { message: 'If the email or phone exists, a password reset code has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    // Validate at least one identifier is provided
    // Values are already trimmed by @Transform decorator
    const email = resetPasswordDto.email && resetPasswordDto.email.length > 0
      ? resetPasswordDto.email
      : null;
    const phone = resetPasswordDto.phone_number && resetPasswordDto.phone_number.length > 0
      ? resetPasswordDto.phone_number
      : null;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone_number must be provided');
    }

    // Build where condition - prioritize email, then phone (by username)
    const whereCondition: any = {};
    if (email) {
      whereCondition.email = email;
    } else if (phone) {
      whereCondition.username = phone;
    }

    // Find user by email or username (phone)
    const user = await this.userRepository.findOne({
      where: whereCondition,
      select: ['id', 'password_hash'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordReset = await this.passwordResetRepository.findOne({
      where: {
        user_id: user.id,
        reset_code: resetPasswordDto.reset_code,
        is_used: false,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Mark reset code as used
    passwordReset.is_used = true;
    await this.passwordResetRepository.save(passwordReset);

    // Update password
    const passwordHash = await bcrypt.hash(resetPasswordDto.new_password, 10);
    user.password_hash = passwordHash;
    await this.userRepository.save(user);

    // Invalidate cache when password changes
    await this.invalidateUserCache(user.id);

    return { message: 'Password reset successfully' };
  }

  async logout(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'access_token', 'refresh_token'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Clear tokens
    user.access_token = null;
    user.refresh_token = null;
    await this.userRepository.save(user);

    // Invalidate cache
    await this.invalidateUserCache(userId);

    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refresh_token);
      // Optimized: select only needed fields
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        select: [
          'id',
          'username',
          'email',
          'role',
          'auth_type',
          'is_active',
          'is_verified',
          'refresh_token',
          'expires_in',
        ],
      });

      if (!user || user.refresh_token !== refreshTokenDto.refresh_token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Your account has been inactive.. If you want to reactivate it, please contact support.');
      }

      const tokens = await this.generateTokens(user);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          auth_type: user.auth_type,
          is_active: user.is_active,
          is_verified: user.is_verified,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async registerDevice(userId: number, deviceData: {
    device_id: string;
    device_type: DeviceType;
    device_token?: string;
  }): Promise<UserDevice> {
    // Optimized: use upsert pattern for better performance
    let device = await this.deviceRepository.findOne({
      where: {
        user_id: userId,
        device_id: deviceData.device_id,
      },
      select: ['id', 'device_token', 'device_type', 'is_active'],
    });

    if (device) {
      device.device_token = deviceData.device_token || device.device_token;
      device.device_type = deviceData.device_type;
      device.is_active = true;
      device.last_active_at = new Date();
      return await this.deviceRepository.save(device);
    }

    device = this.deviceRepository.create({
      user_id: userId,
      device_id: deviceData.device_id,
      device_type: deviceData.device_type,
      device_token: deviceData.device_token,
      is_active: true,
      last_active_at: new Date(),
    });

    return await this.deviceRepository.save(device);
  }

  private isOAuth(authType: AuthType): boolean {
    return authType === AuthType.GOOGLE || authType === AuthType.APPLE;
  }
}

