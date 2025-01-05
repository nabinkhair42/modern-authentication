import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { createToken } from "@/lib/jwt"
import { sendMagicLinkEmail } from "@/lib/mail"
import { z } from "zod"

const EmailSchema = z.object({
  email: z.string().email("Please enter a valid email address")
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = EmailSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = validatedData.data

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
      {
        userId: user._id.toString(),
        email: user.email,
        type: "magic"
      },
      "magic",
      "15m"
    )

    // Send magic link email
    await sendMagicLinkEmail(email, token)

    return NextResponse.json({ 
      message: "Magic link sent successfully"
    })
  } catch (error) {
    console.error("[MAGIC_LINK]", error)
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    )
  }
}
