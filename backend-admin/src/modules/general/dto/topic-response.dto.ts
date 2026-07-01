import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopicResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  parent_id: number;

  @ApiProperty()
  topic_slug: string;

  @ApiProperty()
  topic_name: string;

  @ApiProperty({ nullable: true })
  topic_description: string | null;

  @ApiProperty({ nullable: true })
  topic_image: string | null;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty({ nullable: true })
  created_by: number | null;

  @ApiProperty({ nullable: true })
  updated_by: number | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'true for parent topics (parent_id = 0)',
  })
  category?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Parent topic name (for subtopics)',
  })
  parent_name?: string | null;

  @ApiPropertyOptional({ type: () => [TopicResponseDto] })
  children?: TopicResponseDto[];

  @ApiPropertyOptional({ type: () => TopicResponseDto, nullable: true })
  parent?: TopicResponseDto | null;
}
