import axios from 'axios';
import { CommentModel } from './db/comment.db';
import { Comment } from './commentsModels';

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
      contentType: 'comment'
    }, { timeout: 5000 });

    if (!response.data.approved) {
      throw new Error('Your comment contains inappropriate content and cannot be published.');
    }
  } catch (error: any) {
    // If moderation service is unavailable, log but don't block (graceful degradation)
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn('Moderation service unavailable:', error.message);
      return;
    }
    
    // For flagged content or API errors, throw to prevent commenting
    throw error;
  }
}

export class CommentService {

    async getCommentsByPost(postId: number): Promise<Comment[]> {
        const comments = await CommentModel.findAll({
            where: { postId },
            order: [["createdAt", "ASC"]]
        });

        const enriched = await Promise.all(comments.map(async (c) => {
            const authorName = await getUserName(c.userId);
            return {
                id: c.id,
                postId: c.postId,
                userId: c.userId,
                text: c.text,
                authorName,
                createdAt: c.createdAt || undefined
            };
        }));

        return enriched;
    }

    async createComment(postId: number, userId: number, text: string): Promise<Comment> {
        // Moderate the comment content before creating
        await moderateContent(text);

        const comment = await CommentModel.create({ postId, userId, text });
        const authorName = await getUserName(userId);

        return {
            id: comment.id,
            postId: comment.postId,
            userId: comment.userId,
            text: comment.text,
            authorName,
            createdAt: comment.createdAt || undefined
        };
    }

    async deleteComment(commentId: number, userId: number): Promise<boolean> {
        const comment = await CommentModel.findByPk(commentId);
        if (!comment) {
            return false;
        }

        if (comment.userId !== userId) {
            return false;
        }

        await comment.destroy();
        return true;
    }

    async countByUser(userId: number): Promise<number> {
        return CommentModel.count({ where: { userId } });
    }
}
