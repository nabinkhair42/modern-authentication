import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const { email } = await req.json();

  try {
    await sendPasswordResetEmail(email);
    return NextResponse.json({ message: "Password reset email sent" });
  } catch (error) {
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
