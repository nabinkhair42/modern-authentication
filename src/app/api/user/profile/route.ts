import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { z } from "zod"

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
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
      createdAt: user.createdAt
    })
  } catch (error) {
    console.error("[GET_PROFILE]", error)
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
    const validatedData = UpdateProfileSchema.parse(body)

    const client = await connectToDatabase()
    const db = client.db()

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { name: validatedData.name } }
    )

    if (!result.matchedCount) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("[UPDATE_PROFILE]", error)
    
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
