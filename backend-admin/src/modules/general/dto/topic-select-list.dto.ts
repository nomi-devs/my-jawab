/**
 * DTO for topic select list response
 * Simplified format for dropdown/select components
 */
export class TopicSelectListDto {
  id: number;
  parent_id: number;
  name: string;
  slug: string;
  image?: string | null;
  children?: TopicSelectListDto[];
}
