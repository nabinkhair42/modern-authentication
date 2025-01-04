import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { verifyToken } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    // Verify token
    const payload = await verifyToken(token, "verification")
    if (!payload?.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Invalid or expired token`
      )
    }

    // Connect to database
    const client = await connectToDatabase()
    const db = client.db()

    // Update user
    const result = await db
      .collection("users")
      .updateOne(
        { email: payload.email },
        { $set: { verified: true, updatedAt: new Date() } }
      )

    if (!result.matchedCount) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=User not found`
      )
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/signin?success=Email verified successfully`
    )
  } catch (error) {
    console.error("[VERIFY]", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Invalid or expired token`
    )
  }
}
