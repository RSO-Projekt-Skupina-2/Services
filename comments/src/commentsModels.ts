export interface Comment {
  id: number;
  postId: number;
  userId: number;
  text: string;
  authorName?: string;
  createdAt?: Date;
}
