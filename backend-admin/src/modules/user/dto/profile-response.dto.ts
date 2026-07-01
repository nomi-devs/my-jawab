import { ApiProperty } from '@nestjs/swagger';
import { ProfileGender } from '../entities/user-profile.entity';

export class ProfileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 7 })
  user_id: number;

  @ApiProperty({ example: 'John Doe', nullable: true })
  full_name: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/pic.jpg', nullable: true })
  profile_picture: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/bg.jpg', nullable: true })
  profile_background: string | null;

  @ApiProperty({
    example: 'Software Engineer | Tech Enthusiast',
    nullable: true,
  })
  tagline: string | null;

  @ApiProperty({
    example: 'A passionate developer from Karachi.',
    nullable: true,
  })
  profile_bio: string | null;

  @ApiProperty({ enum: ProfileGender, nullable: true, example: 'male' })
  profile_gender: ProfileGender | null;

  @ApiProperty({ example: '1995-06-15T00:00:00.000Z', nullable: true })
  profile_birthday: Date | null;

  @ApiProperty({ example: 'https://johndoe.dev', nullable: true })
  profile_website: string | null;

  @ApiProperty({ example: 'Karachi, Pakistan', nullable: true })
  profile_location: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
  updated_at: Date;
}
