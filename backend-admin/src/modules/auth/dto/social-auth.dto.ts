import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SocialAuthDto {
  @ApiProperty({
    description: 'Social provider the client already authenticated with',
    enum: ['google', 'apple'],
    example: 'google',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsNotEmpty()
  @IsIn(['google', 'apple'], {
    message: 'providerType must be either "google" or "apple"',
  })
  providerType: 'google' | 'apple';

  @ApiProperty({
    description:
      "The user's unique ID from the provider (Google sub / Apple user identifier)",
    example: '117905671098246513544',
  })
  @IsNotEmpty()
  @IsString()
  providerId: string;

  @ApiProperty({
    description: 'Email decoded from the provider profile by the client',
    example: 'john@example.com',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Full name from the provider profile' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Phone number, if collected by the client',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Phone country code, e.g. "+92"' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL from the provider' })
  @IsOptional()
  @IsString()
  profilePic?: string;

  @ApiPropertyOptional({ description: 'Push notification token' })
  @IsOptional()
  @IsString()
  deviceToken?: string;

  // Not part of the mobile-facing contract above, but accepted the same way
  // register()/login() do — if the client has a device_id, pass it along so
  // the push token actually gets persisted (registerDevice() needs a
  // device_id as its upsert key; deviceToken alone isn't enough to store it).
  @ApiPropertyOptional({
    description: 'Device identifier, enables saving deviceToken',
  })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiPropertyOptional({ description: 'Device type', example: 'ios' })
  @IsOptional()
  @IsString()
  device_type?: string;
}
