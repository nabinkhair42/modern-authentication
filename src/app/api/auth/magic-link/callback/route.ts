import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/db/db";
import { createToken, verifyToken } from "@/lib/auth/jwt";
import { ObjectId } from "mongodb";
import { handleAuthError } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Invalid token`
      );
    }

    // Verify the magic link token
    const payload = await verifyToken(token, "magic");
    if (!payload?.userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Invalid or expired token`
      );
    }

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db();

    // Get user from database
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(payload.userId) });

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=User not found`
      );
    }

    // Create session token
    const sessionToken = await createToken(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name
        },
        type: "session"
      },
      "session",
      "7d"
    );

    // Create response with redirect
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/`
    );

    // Set session cookie
    response.cookies.set(process.env.COOKIE_NAME!, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error("[MAGIC_LINK_CALLBACK]", error);
    const { error: errorMessage, status } = handleAuthError(error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=${errorMessage}`
    );
  }
}
