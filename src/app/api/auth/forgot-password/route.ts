import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { ForgotPasswordSchema } from "@/lib/schemas"
import { createToken } from "@/lib/jwt"
import { sendPasswordResetEmail } from "@/lib/mail"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ForgotPasswordSchema.parse(body)

    const { email } = validatedData

    // Connect to database
    const client = await connectToDatabase()
    const db = client.db()

    // Check if user exists
    const user = await db.collection("users").findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      )
    }

    // Create reset token
    const token = await createToken(
      {
        email, userId: user._id.toString(),
        type: "session"
      },
      "reset",
      "1h"
    )

    // Send reset email
    await sendPasswordResetEmail(email, token)

    return NextResponse.json({
      message: "Password reset email sent successfully",
    })
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
