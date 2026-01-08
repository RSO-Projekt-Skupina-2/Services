export interface User {
  id: number;
  username: string;
  email: string;
  password?: string; // Optional for security - shouldn't be returned in most cases
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface AuthTokenPayload {
  id: number;
  username: string;
  email: string;
}
