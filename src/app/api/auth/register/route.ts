import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { connectToDatabase } from "@/db/db";
import { SignUpSchema } from "@/schemas/schemas";
import { sendVerificationEmail } from "@/helpers/mail";
import { createToken } from "@/lib/auth/jwt";
import { UserModel } from "@/models/user.model";
import { handleApiError } from "@/lib/auth/error-handler";
import { registerRateLimiter, getClientIP } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = getClientIP(request);
    if (registerRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

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
    return handleApiError(error, "REGISTER");
  }
}
