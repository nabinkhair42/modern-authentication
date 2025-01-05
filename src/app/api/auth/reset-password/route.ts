import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcrypt"
import { connectToDatabase } from "@/lib/db"
import { ResetPasswordSchema } from "@/lib/schemas"
import { verifyToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = ResetPasswordSchema.parse(body)
    const { password } = validatedData

    // Verify token
    const payload = await verifyToken(token, "reset")
    if (!payload?.email) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(password, 10)

    // Update password in database
    const client = await connectToDatabase()
    const db = client.db()

    const result = await db.collection("users").updateOne(
      { email: payload.email },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: { 
          resetToken: "",
          resetTokenExpires: "" 
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[RESET_PASSWORD]", error)
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
