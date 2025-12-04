import { Post } from './postsModels';

export class PostService {
    async getPosts(): Promise<Post[]> {
        const mockPost: Post = {
            id: 1,
            text: "Post content",
            author: "M",
            title: "First Post",
            topics: ["technology", "programming"]
            };
        return [mockPost];
    }
}