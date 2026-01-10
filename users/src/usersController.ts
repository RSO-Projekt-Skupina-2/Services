import express, { Router, Request, Response, NextFunction } from "express";
import { UserService } from "./usersService";
import { CreateUserRequest, LoginRequest } from "./usersModels";

const userService: UserService = new UserService();

export const usersController: Router = express.Router();

// Middleware to authenticate requests
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header missing or invalid" });
      return;
    }

    const token = authHeader.substring(7);
    const user = userService.verifyToken(token);

    // Attach user to request for use in route handlers
    (req as any).user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Authentication failed" });
  }
}

// Register a new user
usersController.post(
  "/register",
  async (
    req: Request<{}, {}, CreateUserRequest>,
    res: Response
  ) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({ error: "Missing required fields: username, email, password" });
        return;
      }

      // Basic validation
      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters long" });
        return;
      }

      const user = await userService.createUser({ username, email, password });
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  }
);

// Login
usersController.post(
  "/login",
  async (
    req: Request<{}, {}, LoginRequest>,
    res: Response
  ) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Missing required fields: email, password" });
        return;
      }

      const result = await userService.login({ email, password });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || "Login failed" });
    }
  }
);

// Get current user (requires authentication)
usersController.get(
  "/me",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await userService.getUserById(userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get user by ID (for inter-service communication)
usersController.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      const user = await userService.getUserById(userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Verify token endpoint (for other services)
usersController.post(
  "/verify",
  async (req: Request<{}, {}, { token: string }>, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }

      const user = userService.verifyToken(token);
      res.status(200).json({ valid: true, user });
    } catch (error: any) {
      res.status(401).json({ valid: false, error: error.message });
    }
  }
);
