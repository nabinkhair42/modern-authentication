export interface Session {
  userId: string;
  email: string;
  type: string;
  iat: number;
  exp: number;
}

export interface SessionResponse {
  user: {
    id: string;
    email: string;
  };
  type: string;
  iat: number;
  exp: number;
}