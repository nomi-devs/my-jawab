export class TopicResponseDto {
  id: number;
  parent_id: number;
  topic_slug: string;
  topic_name: string;
  topic_description: string | null;
  topic_image: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  category?: boolean; // true for parent topics (parent_id = 0)
  parent_name?: string | null; // Parent topic name (for subtopics)
  children?: TopicResponseDto[];
  parent?: TopicResponseDto | null;
}

