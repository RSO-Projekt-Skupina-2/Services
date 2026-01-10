import axios from 'axios';
import { CommentModel } from './db/comment.db';
import { Comment } from './commentsModels';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;

export class CommentService {
    private async getUserName(userId: number): Promise<string> {
        try {
            const response = await axios.get(`${USERS_SERVICE_URL}/users/${userId}`);
            return response.data.username || String(userId);
        } catch (error) {
            console.error(`Failed to fetch username for user ${userId}:`, error);
            return String(userId);
        }
    }

    async getCommentsByPost(postId: number): Promise<Comment[]> {
        const comments = await CommentModel.findAll({
            where: { postId },
            order: [["createdAt", "ASC"]]
        });

        const enriched = await Promise.all(comments.map(async (c) => {
            const authorName = await this.getUserName(c.userId);
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
        const comment = await CommentModel.create({ postId, userId, text });
        const authorName = await this.getUserName(userId);

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
}
