import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { TokenPayload } from "@/types/session";

const secretKey = process.env.JWT_SECRET_KEY!;
const key = new TextEncoder().encode(secretKey);

export async function createToken(
  payload: Omit<TokenPayload, "iat" | "exp">,
  type: TokenPayload["type"],
  expiresIn: string
): Promise<string> {
  const token = await new SignJWT({ ...payload, type })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);

  return token;
}

export async function verifyToken(
  token: string,
  type: TokenPayload["type"]
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);

    if (payload.type !== type) {
      console.error("Invalid token type:", { expected: type, got: payload.type });
      return null;
    }

    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Session management
export async function getSession() {
  const userToken = process.env.COOKIE_NAME!;
  const token = cookies().get(userToken)?.value;
  if (!token) return null;

  try {
    return await verifyToken(token, "session");
  } catch {
    return null;
  }
}

// Legacy functions for backward compatibility
export async function encrypt(payload: any) {
  return createToken(payload, "session", "24h");
}

export async function decrypt(token: string): Promise<any> {
  return verifyToken(token, "session");
}

export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error("JWT_SECRET_KEY is not set");
  }
  return secret;
}

export function setUserCookie(token: string): void {
  cookies().set(process.env.COOKIE_NAME!, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function getUserCookie(): string | undefined {
  return cookies().get(process.env.COOKIE_NAME!)?.value;
}

export function removeUserCookie(): void {
  cookies().delete(process.env.COOKIE_NAME!);
}
