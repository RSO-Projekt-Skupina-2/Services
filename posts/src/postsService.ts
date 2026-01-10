import { PostModel } from './db/post.db';
import { Post } from './postsModels';
import axios from 'axios';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;

export class PostService {
    private async getUserName(userId: number): Promise<string> {
        try {
            const response = await axios.get(`${USERS_SERVICE_URL}/users/${userId}`);
            return response.data.username || String(userId);
        } catch (error) {
            console.error(`Failed to fetch username for user ${userId}:`, error);
            return String(userId);
        }
    }

    async getPosts(): Promise<Post[]> {
        const posts = await PostModel.findAll({
            order: [["createdAt", "DESC"]]
        });
        
        const postsWithUsernames = await Promise.all(
            posts.map(async (post) => {
                const authorName = await this.getUserName(post.author);
                return {
                    id: post.id,
                    title: post.title,
                    text: post.text,
                    author: post.author,
                    authorName,
                    topics: post.topics || []
                };
            })
        );
        
        return postsWithUsernames;
    }

    async createPost(title: string, text: string, author: number, topics?: string[]): Promise<Post> {
        const post = await PostModel.create({
            title,
            text,
            author,
            topics: topics || []
        });

        const authorName = await this.getUserName(author);

        return {
            id: post.id,
            title: post.title,
            text: post.text,
            author: post.author,
            authorName,
            topics: post.topics || []
        };
    }

    async deletePost(postId: number, userId: number): Promise<boolean> {
        const post = await PostModel.findByPk(postId);
        
        if (!post) {
            return false;
        }
        
        if (post.author !== userId) {
            return false;
        }
        
        await post.destroy();
        return true;
    }
}
