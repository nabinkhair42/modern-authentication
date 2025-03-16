import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/db/db";
import { createToken } from "@/lib/auth/jwt";
import { TokenPayload } from "@/types/session";
import { UserModel } from "@/models/user.model";
import { redirectWithError } from "@/lib/auth/error-handler";

async function getGithubUser(access_token: string) {
  try {
    // Fetch the user profile from GitHub API
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const user = await response.json();

    // Get user's email from GitHub API
    // Sometimes, the user's email might be private, so we need to make a separate API call
    try {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      });
      
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        const primaryEmail = emails.find((email: any) => email.primary && email.verified)?.email;
        if (primaryEmail) {
          user.email = primaryEmail;
        } else if (emails.length > 0) {
          // Fallback to the first verified email
          const verifiedEmail = emails.find((email: any) => email.verified)?.email;
          if (verifiedEmail) {
            user.email = verifiedEmail;
          } else {
            // Last resort: use the first email
            user.email = emails[0].email;
          }
        }
      }
    } catch (emailError) {
      console.warn("Error fetching GitHub user emails:", emailError);
      // Continue with the user profile, even if email fetching failed
    }

    // If no email was found, use the one from the user profile
    if (!user.email && user.login) {
      // Create a placeholder email if none is available
      user.email = `${user.login}@github.example.com`;
    }

    return user;
  } catch (error) {
    console.error("Error fetching GitHub user data:", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // Validate required parameters
    if (!code) {
      return redirectWithError(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin`,
        "Missing authorization code"
      );
    }

    // Verify state
    const savedState = request.cookies.get("github_oauth_state")?.value;
    if (!savedState || savedState !== state) {
      return redirectWithError(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin`,
        "Invalid state"
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
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return redirectWithError(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin`,
        tokenData.error_description
      );
    }

    // Get GitHub user data
    const githubUser = await getGithubUser(tokenData.access_token);
    if (!githubUser.email) {
      return redirectWithError(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin`,
        "No email found"
      );
    }

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db();

    // Check if user exists
    let user = await db.collection("users").findOne({ email: githubUser.email });

    if (!user) {
      // Create new user
      const newUser: UserModel = {
        email: githubUser.email,
        verified: true, // GitHub users are considered verified
        name: githubUser.name || githubUser.login,
        githubId: githubUser.id.toString(),
        avatar: githubUser.avatar_url,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("users").insertOne(newUser);
      user = {
        ...newUser,
        _id: result.insertedId,
      };
    } else {
      // Update existing user with GitHub info
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            githubId: githubUser.id.toString(),
            avatar: githubUser.avatar_url,
            name: user.name || githubUser.name || githubUser.login,
            updatedAt: new Date(),
          },
        }
      );
    }

    // Create session
    const token = await createToken(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
        type: "session"
      },
      "session",
      "7d"
    );

    // Set cookie and redirect
    const response = NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL!);
    response.cookies.set(process.env.COOKIE_NAME!, token, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error("[GITHUB_CALLBACK]", error);
    return redirectWithError(
      `${process.env.NEXT_PUBLIC_APP_URL}/signin`,
      "Something went wrong"
    );
  }
}
