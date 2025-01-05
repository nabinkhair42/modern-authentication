import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/db/db";
import { verifyToken, createToken } from "@/lib/auth/jwt";
import { TokenPayload } from "@/types/session";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Verify token
    const payload = await verifyToken(token, "verify");
    if (!payload?.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Invalid or expired token`
      );
    }

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db();

    // Update user
    const result = await db
      .collection("users")
      .updateOne(
        { email: payload.email },
        { $set: { verified: true, updatedAt: new Date() } }
      );

    if (!result.matchedCount) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=User not found`
      );
    }

    // Get the user
    const user = await db.collection("users").findOne({ email: payload.email });
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=User not found`
      );
    }

    // Create session token with proper user information
    const sessionPayload: TokenPayload = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      type: "session",
    };

    const sessionToken = await createToken(sessionPayload, "session", "7d");

    // Set the session cookie
    cookies().set(process.env.COOKIE_NAME!, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Redirect to home page
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL!);
  } catch (error) {
    console.error("[VERIFY]", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Invalid or expired token`
    );
  }
}
