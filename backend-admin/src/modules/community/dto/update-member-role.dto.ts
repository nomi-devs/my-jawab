import { IsEnum } from 'class-validator';
import { CommunityUserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: CommunityUserRole, example: 'moderator' })
  @IsEnum(CommunityUserRole)
  role: CommunityUserRole;
}
