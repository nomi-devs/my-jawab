import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './guards/jwt.strategy';
import { DeviceController } from './device/device.controller';
import { DeviceService } from './device/device.service';
import { User, UserVerification, UserPasswordReset, UserDevice } from './entities';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserVerification, UserPasswordReset, UserDevice]),
    PassportModule,
    EmailModule, // Import EmailModule to use EmailTemplatesService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '30d'); // Default: 1 month
        return {
          secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
          signOptions: {
            expiresIn: (expiresIn || '30d') as any, // Default: 1 month (30 days)
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, DeviceController],
  providers: [AuthService, JwtStrategy, DeviceService],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}

