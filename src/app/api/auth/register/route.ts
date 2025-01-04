import { NextResponse } from "next/server"
import { SignUpSchema } from "@/lib/schemas"
import { hashPassword } from "@/lib/password"
import client from "@/lib/db"
import { ZodError } from "zod"
import { MongoError } from "mongodb"

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { email, password } = SignUpSchema.parse(body)

    const db = (await client).db("auth-db")
    
    // Check if email exists
    const existingUser = await db.collection("users").findOne({ 
      email,
      // Only consider users who have set up a password
      password: { $exists: true }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      )
    }

    // Check if there's a magic link user
    const magicLinkUser = await db.collection("users").findOne({
      email,
      password: { $exists: false }
    })

    const hashedPassword = await hashPassword(password)

    if (magicLinkUser) {
      // Update existing magic link user with password
      await db.collection("users").updateOne(
        { _id: magicLinkUser._id },
        { 
          $set: { 
            password: hashedPassword,
            emailVerified: new Date()
          } 
        }
      )
    } else {
      // Create new user
      await db.collection("users").insertOne({
        email,
        password: hashedPassword,
        emailVerified: null,
      })
    }

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("[REGISTER_ERROR]", error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    if (error instanceof MongoError) {
      if (error.code === 11000) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}
