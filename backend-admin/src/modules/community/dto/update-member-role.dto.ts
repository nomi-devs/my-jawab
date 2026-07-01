import { IsEnum } from 'class-validator';
import { CommunityUserRole } from '../entities/community-user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: CommunityUserRole, example: 'moderator' })
  @IsEnum(CommunityUserRole)
  role: CommunityUserRole;
}
