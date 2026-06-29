import { ProfileGender } from '../entities/user-profile.entity';

export class ProfileResponseDto {
  id: number;
  user_id: number;
  full_name: string | null;
  profile_picture: string | null;
  profile_background: string | null;
  tagline: string | null;
  profile_bio: string | null;
  profile_gender: ProfileGender | null;
  profile_birthday: Date | null;
  profile_website: string | null;
  profile_location: string | null;
  created_at: Date;
  updated_at: Date;
}

