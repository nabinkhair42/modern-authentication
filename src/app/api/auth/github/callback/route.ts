import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/db/db";
import { createToken } from "@/lib/auth/jwt";
import { TokenPayload } from "@/types/session";
import { UserModel } from "@/models/user.model";

async function getGithubUser(access_token: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: "application/json",
    },
  });
  const user = await response.json();

  // Get user's email
  const emailsResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: "application/json",
    },
  });
  const emails = await emailsResponse.json();
  const primaryEmail = emails.find((email: any) => email.primary)?.email || user.email;

  return { ...user, email: primaryEmail };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // Verify state
    const savedState = request.cookies.get("github_oauth_state")?.value;
    if (!savedState || savedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Invalid state`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=${tokenData.error_description}`
      );
    }

    // Get user data from GitHub
    const githubUser = await getGithubUser(tokenData.access_token);
    if (!githubUser.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=No email found`
      );
    }

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db();

    // Find or create user
    let user = await UserModel.findByEmail(db, githubUser.email);

    if (user) {
      // Update existing user
      await UserModel.update(db, user._id.toString(), {
        name: githubUser.name || githubUser.login,
        image: githubUser.avatar_url,
        githubId: githubUser.id.toString(),
      });
    } else {
      // Create new user
      user = await UserModel.create(db, {
        email: githubUser.email,
        name: githubUser.name || githubUser.login,
        image: githubUser.avatar_url,
        githubId: githubUser.id.toString(),
        provider: "github",
        verified: true, // GitHub users are pre-verified
      });
    }

    // Create session token
    const sessionPayload: TokenPayload = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      type: "session",
    };

    const token = await createToken(sessionPayload, "session", "7d");

    // Create response with redirect
    const response = NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL!);

    // Set cookie
    response.cookies.set(process.env.COOKIE_NAME!, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[GITHUB_CALLBACK]", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=Something went wrong`
    );
  }
}
