import { PostModel } from './db/post.db';
import { Post } from './postsModels';

export class PostService {
    async getPosts(): Promise<Post[]> {
        const posts = await PostModel.findAll({
            order: [["createdAt", "DESC"]]
        });
        
        return posts.map((post) => ({
            id: post.id,
            title: post.title,
            text: post.text,
            author: post.author,
            topics: post.topics || []
        }));
    }

    async createPost(title: string, text: string, author: number, topics?: string[]): Promise<Post> {
        const post = await PostModel.create({
            title,
            text,
            author,
            topics: topics || []
        });

        return {
            id: post.id,
            title: post.title,
            text: post.text,
            author: post.author,
            topics: post.topics || []
        };
    }
}