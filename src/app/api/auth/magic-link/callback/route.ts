import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { verifyToken, createToken } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Invalid token`
      )
    }

    // Verify magic link token
    const payload = await verifyToken(token, "magic")
    if (!payload?.email || !payload?.userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Invalid or expired token`
      )
    }

    // Connect to database
    const client = await connectToDatabase()
    const db = client.db()

    // Verify user exists
    const user = await db.collection("users").findOne({ email: payload.email })
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=User not found`
      )
    }

    // Create session token
    const sessionToken = await createToken(
      { userId: user._id.toString() },
      "session",
      "7d"
    )

    // Create response with redirect
    const response = NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL!)

    // Set cookie
    response.cookies.set(process.env.COOKIE_NAME!, sessionToken, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("[MAGIC_LINK_CALLBACK]", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Something went wrong`
    )
  }
}
