import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { connectToDatabase } from "@/db/db";
import { SignUpSchema } from "@/schemas/schemas";
import { sendVerificationEmail } from "@/helpers/mail";
import { createToken } from "@/lib/auth/jwt";
import { UserModel } from "@/models/user.model";

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const validatedData = SignUpSchema.parse(body);
    const { email, password } = validatedData;

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db();

    // Check if user exists
    const existingUser = await UserModel.findByEmail(db, email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await UserModel.create(db, {
      email,
      name: email.split("@")[0], // Default name from email
      password: hashedPassword,
      provider: "credentials",
      verified: false,
    });

    // Create verification token
    const verificationToken = await createToken(
      {
        email,
        type: "verify"
      },
      "verify",
      "1h"
    );

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (error: unknown) {
    console.error("[REGISTER]", error);

    // Handle Zod validation errors
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: (error as unknown as { issues: any[] }).issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
