import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import { Session,  AuthError } from "@/types/session";

export async function getServerSession(): Promise<Session | null> {
  try {
    const token = cookies().get(process.env.COOKIE_NAME!)?.value;
    if (!token) return null;

    const payload = await verifyToken(token, "session");
    if (!payload?.user) return null;

    return {
      user: {
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name,
      },
      expires: new Date(payload.exp! * 1000),
    };
  } catch (error) {
    return null;
  }
}

export function handleAuthError(error: unknown): AuthError {
  if (error instanceof Error) {
    return {
      error: error.message,
      status: 400,
    };
  }
  return {
    error: "Something went wrong",
    status: 500,
  };
}

export function validateSession(session: Session | null): AuthError | null {
  if (!session) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }
  if (session.expires < new Date()) {
    return {
      error: "Session expired",
      status: 401,
    };
  }
  return null;
}
