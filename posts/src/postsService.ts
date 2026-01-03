import { Post } from './postsModels';

export class PostService {
    async getPosts(): Promise<Post[]> {
        const mockPost1: Post = {
            id: 1,
            text: "Post content",
            author: "M",
            title: "First Post",
            topics: ["technology", "programming"]
        };

        const mockPost2: Post = {
            id: 2,
            text: "This post was created with CI/CD",
            author: "J",
            title: "Second Post",
            topics: ["cloud", "rso"]
        };

        return [mockPost1, mockPost2];
    }
}
