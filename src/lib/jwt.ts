import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.JWT_SECRET_KEY!
const key = new TextEncoder().encode(secretKey)

type TokenType = 'session' | 'verification' | 'reset' | 'magic'

export async function createToken(
  payload: any,
  type: TokenType,
  expiresIn: string
) {
  return await new SignJWT({ ...payload, type })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key)
}

export async function verifyToken(token: string, type: TokenType): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, key)
    if (payload.type !== type) {
      throw new Error('Invalid token type')
    }
    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Session management
export async function getSession() {
  const cookieName = process.env.COOKIE_NAME!
  const token = cookies().get(cookieName)?.value
  if (!token) return null

  try {
    return await verifyToken(token, 'session')
  } catch {
    return null
  }
}

// Legacy functions for backward compatibility
export async function encrypt(payload: any) {
  return createToken(payload, 'session', '24h')
}

export async function decrypt(token: string): Promise<any> {
  return verifyToken(token, 'session')
}

// Cookie management
export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) {
    throw new Error('JWT_SECRET_KEY is not set')
  }
  return secret
}

export function setUserCookie(token: string) {
  cookies().set(process.env.COOKIE_NAME!, token, {
    httpOnly: true,
    secure: process.env.SECURE_COOKIES === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

export function getUserCookie() {
  return cookies().get(process.env.COOKIE_NAME!)?.value
}

export function removeUserCookie() {
  cookies().delete(process.env.COOKIE_NAME!)
}
