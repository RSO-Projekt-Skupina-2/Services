export interface Post {
  id: number;
  title: string;
  text: string;
  author: number;  // ID of the user who created the post
  authorName?: string;  // Username fetched from users service
  topics: string[];
}