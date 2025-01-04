import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { createToken } from "@/lib/jwt"
import { sendMagicLinkEmail } from "@/lib/mail"
import { ForgotPasswordSchema } from "@/lib/schemas"

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

    // Create magic link token
    const token = await createToken(
      { email, userId: user._id.toString() },
      "magic",
      "15m"
    )

    // Send magic link email
    await sendMagicLinkEmail(email, token)

    return NextResponse.json({
      message: "Magic link sent successfully",
    })
  } catch (error) {
    console.error("[MAGIC_LINK]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
