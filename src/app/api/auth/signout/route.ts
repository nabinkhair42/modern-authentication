import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Delete auth cookie
    cookies().delete(process.env.COOKIE_NAME!)

    return NextResponse.json({ message: "Signed out successfully" })
  } catch (error) {
    console.error("[SIGNOUT]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
