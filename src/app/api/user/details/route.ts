import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { z } from "zod"

const UpdateDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const client = await connectToDatabase()
    const db = client.db()

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      verified: user.verified
    })
  } catch (error) {
    console.error("[GET_USER_DETAILS]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateDetailsSchema.parse(body)

    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    const client = await connectToDatabase()
    const db = client.db()

    // If email is being updated, check if it's already in use
    if (validatedData.email) {
      const existingUser = await db.collection("users").findOne({
        email: validatedData.email,
        _id: { $ne: new ObjectId(session.user.id) }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }

      // Reset verification if email is changed
      validatedData.verified = false
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: validatedData }
    )

    if (!result.matchedCount) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // If email was changed, send verification email
    if (validatedData.email) {
      // TODO: Implement sending verification email
    }

    return NextResponse.json({ 
      message: "User details updated successfully",
      requiresVerification: validatedData.email ? true : false
    })
  } catch (error) {
    console.error("[UPDATE_USER_DETAILS]", error)
    
    if (error instanceof z.ZodError) {
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
