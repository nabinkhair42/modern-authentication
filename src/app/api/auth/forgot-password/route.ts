import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/db/db"
import { ForgotPasswordSchema } from "@/schemas/schemas"
import { createToken } from "@/lib/auth/jwt"
import { sendPasswordResetEmail } from "@/helpers/mail"
import { handleApiError } from "@/lib/auth/error-handler"
import { passwordResetRateLimiter, getClientIP } from "@/lib/auth/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = getClientIP(request);
    if (passwordResetRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429 }
      );
    }
    
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
        type: "reset"
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
    return handleApiError(error, "FORGOT_PASSWORD");
  }
}
