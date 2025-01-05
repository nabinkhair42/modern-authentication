import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcrypt"
import { connectToDatabase } from "@/lib/db"
import { SignUpSchema } from "@/lib/schemas"
import { sendVerificationEmail } from "@/lib/mail"
import { createToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    console.log("[REGISTER] Starting registration process")
    
    const body = await request.json()
    console.log("[REGISTER] Request body:", { email: body.email, hasPassword: !!body.password, hasConfirmPassword: !!body.confirmPassword })
    
    const validatedData = SignUpSchema.parse(body)
    console.log("[REGISTER] Data validated successfully")

    const { email, password } = validatedData

    // Connect to database
    console.log("[REGISTER] Connecting to database")
    const client = await connectToDatabase()
    const db = client.db()

    // Check if user exists
    console.log("[REGISTER] Checking for existing user")
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      console.log("[REGISTER] User already exists")
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    console.log("[REGISTER] Hashing password")
    const hashedPassword = await hash(password, 12)

    // Create verification token
    console.log("[REGISTER] Creating verification token")
    const verificationToken = await createToken(
      {
        email,
        type: "session"
      },
      "verify",
      "1h"
    )

    // Create user
    console.log("[REGISTER] Creating new user")
    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send verification email
    console.log("[REGISTER] Sending verification email")
    await sendVerificationEmail(email, verificationToken)

    console.log("[REGISTER] Registration successful")
    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("[REGISTER]", error)
    
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === "ZodError" && 'issues' in error) {
        return NextResponse.json(
          { error: "Validation failed", issues: error.issues },
          { status: 400 }
        )
      }

      // Handle database errors
      if (error.name === "MongoError" || error.name === "MongoServerError") {
        return NextResponse.json(
          { error: "Database error occurred" },
          { status: 500 }
        )
      }
    }

    // Handle email sending errors
    if (
      error && 
      typeof error === 'object' && 
      'message' in error && 
      typeof (error as { message: string }).message === 'string' && 
      (error as { message: string }).message.includes("email")
    ) {
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
