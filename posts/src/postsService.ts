import axios from 'axios';
import { PostModel } from './db/post.db';
import { Post } from './postsModels';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;
const MODERATION_SERVICE_URL = process.env.MODERATION_SERVICE_URL;

async function getUserName(userId: number): Promise<string> {
  try {
    const response = await axios.get(`${USERS_SERVICE_URL}/users/${userId}`);
    return response.data.username || String(userId);
  } catch (error) {
    console.error(`Failed to fetch username for user ${userId}:`, error);
    return String(userId);
  }
}

async function moderateContent(content: string): Promise<void> {
  if (!MODERATION_SERVICE_URL) {
    console.warn('MODERATION_SERVICE_URL not configured, skipping moderation');
    return;
  }

  try {
    const response = await axios.post(`${MODERATION_SERVICE_URL}/moderation/check`, {
      content,
      contentType: 'post'
    }, { timeout: 5000 });

    if (!response.data.approved) {
      throw new Error('Your post contains inappropriate content and cannot be published.');
    }
  } catch (error: any) {
    // If moderation service is unavailable, log but don't block (graceful degradation)
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn('Moderation service unavailable:', error.message);
      return;
    }
    
    // For flagged content or API errors, throw to prevent posting
    throw error;
  }
}

export class PostService {

    async getPosts(): Promise<Post[]> {
        const posts = await PostModel.findAll({
            order: [["createdAt", "DESC"]]
        });
        
        const postsWithUsernames = await Promise.all(
            posts.map(async (post) => {
                const authorName = await getUserName(post.author);
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
        // Moderate both title and text in a single request
        await moderateContent(`${title}\n${text}`);

        const post = await PostModel.create({
            title,
            text,
            author,
            topics: topics || []
        });

        const authorName = await getUserName(author);

        return {
            id: post.id,
            title: post.title,
            text: post.text,
            author: post.author,
            authorName,
            topics: post.topics || []
        };
    }

    async countByAuthor(authorId: number): Promise<number> {
        return PostModel.count({ where: { author: authorId } });
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
