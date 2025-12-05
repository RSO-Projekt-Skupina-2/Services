export interface Post {
  id: number;
  title: string;
  text: string;
  author: number;  // ID of the user who created the post
  topics: string[];
}