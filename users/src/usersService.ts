import { UserModel } from "./db/user.db";
import { User, CreateUserRequest, LoginRequest, LoginResponse, AuthTokenPayload } from "./usersModels";
import * as bcrypt from "bcryptjs";
import { sign, verify, SignOptions } from "jsonwebtoken";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export class UserService {
  /**
   * Create a new user with hashed password
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Check if user already exists
    const existingUser = await UserModel.findOne({
      where: {
        email: userData.email,
      },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Check if username is taken
    const existingUsername = await UserModel.findOne({
      where: {
        username: userData.username,
      },
    });

    if (existingUsername) {
      throw new Error("Username is already taken");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user
    const user = await UserModel.create({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
    });

    // Return user without password
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Authenticate user and return JWT token
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    // Find user by email
    const user = await UserModel.findOne({
      where: {
        email: loginData.email,
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(loginData.password, user.password);

    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const payload: AuthTokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const signOptions = {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions;

    const token = sign(payload, JWT_SECRET, signOptions);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  /**
   * Verify JWT token and return user data
   */
  verifyToken(token: string): AuthTokenPayload {
    try {
      const payload = verify(token, JWT_SECRET) as AuthTokenPayload;
      return payload;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Get user by ID (for inter-service communication)
   */
  async getUserById(id: number): Promise<User | null> {
    const user = await UserModel.findByPk(id);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get all users (for admin purposes or inter-service communication)
   */
  async getAllUsers(): Promise<User[]> {
    const users = await UserModel.findAll({
      order: [["createdAt", "DESC"]],
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  /**
   * Update user information
   */
  async updateUser(id: number, updates: Partial<CreateUserRequest>): Promise<User> {
    const user = await UserModel.findByPk(id);

    if (!user) {
      throw new Error("User not found");
    }

    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    // Check if email is being changed and is already taken
    if (updates.email && updates.email !== user.email) {
      const existingUser = await UserModel.findOne({
        where: { email: updates.email },
      });

      if (existingUser) {
        throw new Error("Email is already taken");
      }
    }

    // Check if username is being changed and is already taken
    if (updates.username && updates.username !== user.username) {
      const existingUsername = await UserModel.findOne({
        where: { username: updates.username },
      });

      if (existingUsername) {
        throw new Error("Username is already taken");
      }
    }

    await user.update(updates);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<void> {
    const user = await UserModel.findByPk(id);

    if (!user) {
      throw new Error("User not found");
    }

    await user.destroy();
  }
}
