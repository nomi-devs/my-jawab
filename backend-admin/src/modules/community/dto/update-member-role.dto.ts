import { IsEnum } from 'class-validator';
import { CommunityUserRole } from '../entities/community-user.entity';

export class UpdateMemberRoleDto {
  @IsEnum(CommunityUserRole)
  role: CommunityUserRole;
}

