import axios from "axios";

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;
const POSTS_SERVICE_URL = process.env.POSTS_SERVICE_URL;
const LIKES_SERVICE_URL = process.env.LIKES_SERVICE_URL;
const COMMENTS_SERVICE_URL = process.env.COMMENTS_SERVICE_URL;

export interface ProfileSummary {
  id: number;
  username: string;
  email: string;
  postsCount: number;
  likesGivenCount: number;
  commentsCount: number;
}

export class ProfileService {
  async getProfile(token: string): Promise<ProfileSummary> {
    const headers = { Authorization: `Bearer ${token}` };

    const userPromise = axios.get(`${USERS_SERVICE_URL}/users/me`, { headers });
    const postsPromise = axios.get(`${POSTS_SERVICE_URL}/posts/count/mine`, { headers });
    const likesPromise = axios.get(`${LIKES_SERVICE_URL}/likes/user/count`, { headers });
    const commentsPromise = axios.get(`${COMMENTS_SERVICE_URL}/comments/user/count`, { headers });

    const [userRes, postsRes, likesRes, commentsRes] = await Promise.all([
      userPromise,
      postsPromise,
      likesPromise,
      commentsPromise,
    ]);

    const user = userRes.data;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      postsCount: postsRes.data.count,
      likesGivenCount: likesRes.data.count,
      commentsCount: commentsRes.data.count,
    };
  }
}
