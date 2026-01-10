import express, { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { ProfileService } from "./profileService";

const profileService = new ProfileService();
export const profileController: Router = express.Router();

interface AuthTokenPayload {
  id: number;
  username: string;
  email: string;
}

type AuthedRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = Request<P, ResBody, ReqBody, ReqQuery> & { user?: AuthTokenPayload };

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;

async function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }

    const token = authHeader.substring(7);
    const verifyRes = await axios.post(`${USERS_SERVICE_URL}/users/verify`, { token });

    if (!verifyRes.data?.valid || !verifyRes.data?.user) {
      res.status(401).json({ error: "Token verification failed" });
      return;
    }

    req.user = verifyRes.data.user as AuthTokenPayload;
    (req as any).token = token;
    next();
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Authentication failed";
    res.status(401).json({ error: message });
  }
}

profileController.get(
  "/me",
  authenticate,
  async (req: AuthedRequest, res: Response) => {
    try {
      const token = (req as any).token as string;
      const profile = await profileService.getProfile(token);
      res.status(200).json(profile);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to load profile" });
    }
  }
);
