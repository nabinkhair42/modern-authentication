import { NextRequest, NextResponse } from "next/server"
import { redirectWithError } from "@/lib/auth/error-handler"

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID
    const redirectUri = process.env.GITHUB_CALLBACK_URL
    
    // Validate required configuration
    if (!clientId || !redirectUri) {
      console.error("[GITHUB_AUTH] Missing GitHub OAuth configuration");
      return redirectWithError(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin`,
        "OAuth configuration error"
      );
    }

    // Generate random state
    const state = Math.random().toString(36).substring(7)

    // Store state in cookie for verification
    const response = NextResponse.redirect(
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=user:email`
    )

    response.cookies.set("github_oauth_state", state, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    })

    return response
  } catch (error) {
    console.error("[GITHUB_AUTH]", error)
    return redirectWithError(
      `${process.env.NEXT_PUBLIC_APP_URL}/signin`,
      "Internal server error"
    );
  }
}
