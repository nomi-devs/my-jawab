import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'Authenticated user details', type: Object })
  user: {
    id: number;
    username: string;
    email: string | null;
    phone_number?: string | null;
    role: string;
    auth_type: string;
    is_active: boolean;
    is_verified: boolean;
  };

  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGci...' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGci...' })
  refresh_token: string;

  @ApiProperty({ description: 'Access token expiry in seconds', example: 3600 })
  expires_in: number;
}
