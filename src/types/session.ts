export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  provider?: string;
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Session {
  user: User;
  expires: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

export interface SessionResponse {
  user: SessionUser;
  expires: string;
  isLoggedIn: boolean;
}

export interface TokenPayload {
  user?: SessionUser;
  userId?: string;
  email?: string;
  type: "session" | "magic" | "reset" | "verify";
  iat?: number;
  exp?: number;
}

export interface AuthError {
  error: string;
  status: number;
}
