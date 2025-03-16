import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/db/db"
import { createToken } from "@/lib/auth/jwt"
import { sendMagicLinkEmail } from "@/helpers/mail"
import { z } from "zod"
import { handleApiError } from "@/lib/auth/error-handler"
import { loginRateLimiter, getClientIP } from "@/lib/auth/rate-limit"

const EmailSchema = z.object({
  email: z.string().email("Please enter a valid email address")
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = getClientIP(request);
    if (loginRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: "Too many magic link requests. Please try again later." },
        { status: 429 }
      );
    }
    
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
    return handleApiError(error, "MAGIC_LINK");
  }
}
