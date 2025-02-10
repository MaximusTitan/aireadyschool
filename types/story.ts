export interface Story {
  id: number;
  title: string;
  genre: string;
  created_at: string;
  story: string;
  image_url: string;
  description?: string;
  age_group: string;
  tone: string;
  length: string;
  user_email?: string;
}
