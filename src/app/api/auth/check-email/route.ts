import { NextResponse } from "next/server"
import client from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const db = (await client).db("auth-db")
    const user = await db.collection("users").findOne({ email })

    return NextResponse.json({ exists: !!user })
  } catch (error) {
    console.error("[CHECK_EMAIL_ERROR]", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
