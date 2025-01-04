import { NextResponse } from "next/server";
import client from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { ResetPasswordSchema } from "@/lib/schemas";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    const validatedData = ResetPasswordSchema.parse({
      password,
      confirmPassword: password,
    });

    const db = (await client).db("auth-db");

    // Find user with valid reset token
    const user = await db.collection("users").findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired reset token. Please request a new reset link.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(validatedData.password);

    // Update password and remove reset token
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiry: "" },
      }
    );

    return NextResponse.json({
      message:
        "Your password has been successfully reset. You can now sign in with your new password.",
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError" &&
      "errors" in error
    ) {
      const zodError = error as { errors: Array<{ message: string }> };
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Failed to reset password. Please try again or request a new reset link.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { email } = await req.json();

    const db = (await client).db("auth-db");

    // Find user with password (exclude magic link only users)
    const user = await db.collection("users").findOne({
      email,
      password: { $exists: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "No account found with this email address. Please check your email or sign up for a new account.",
        },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
        },
      }
    );

    // Here you would typically send an email with the reset link
    // For now, we'll just return the token (in production, send via email)
    return NextResponse.json({
      message:
        "Password reset link has been sent to your email address. Please check your inbox.",
      // Remove this in production, send via email instead
      debug: { resetToken },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
