import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcrypt"
import { connectToDatabase } from "@/lib/db"
import { SignInSchema } from "@/lib/schemas"
import { createToken, setUserCookie } from "@/lib/jwt"

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

    // Create session token with user data
    const token = await createToken(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name
        }
      },
      "session",
      "7d"
    )

    // Set cookie
    setUserCookie(token)

    return NextResponse.json({
      message: "Signed in successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error("[SIGNIN]", error)
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
