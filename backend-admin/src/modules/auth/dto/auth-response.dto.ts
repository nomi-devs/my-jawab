import { UserRole, AuthType } from '../entities/user.entity';

export class AuthResponseDto {
  user: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    auth_type: AuthType;
    is_active: boolean;
    is_verified: boolean;
  };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

