import { LikeModel } from "./db/like.db";
import { Like } from "./likesModels";

export class LikeService {
  async getLikeCount(postId: number): Promise<number> {
    return await LikeModel.count({
      where: { postId },
    });
  }

  async hasUserLiked(postId: number, userId: number): Promise<boolean> {
    const existing = await LikeModel.findOne({ where: { postId, userId } });
    return Boolean(existing);
  }

  async addLike(postId: number, userId: number): Promise<Like> {
    const like = await LikeModel.create({
      postId,
      userId,
    });

    return {
      id: like.id,
      postId: like.postId,
      userId: like.userId,
      createdAt: like.createdAt,
    };
  }

  async removeLike(postId: number, userId: number): Promise<boolean> {
    const deleted = await LikeModel.destroy({
      where: { postId, userId },
    });

    return deleted > 0;
  }

  async countByUser(userId: number): Promise<number> {
    return LikeModel.count({ where: { userId } });
  }
}
