import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcrypt"
import { connectToDatabase } from "@/lib/db"
import { SignInSchema } from "@/lib/schemas"
import { createToken } from "@/lib/jwt"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = SignInSchema.parse(body)

    const { email, password } = validatedData

    // Connect to database
    const client = await connectToDatabase()
    const db = client.db()

    // Find user
    const user = await db.collection("users").findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Check password
    const isValid = await compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.verified) {
      return NextResponse.json(
        { error: "Please verify your email first" },
        { status: 401 }
      )
    }

    // Create session token
    const token = await createToken(
      { userId: user._id.toString() },
      "session",
      "7d"
    )

    // Set cookie
    cookies().set({
      name: process.env.COOKIE_NAME!,
      value: token,
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return NextResponse.json({ message: "Signed in successfully" })
  } catch (error) {
    console.error("[SIGNIN]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
