import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcrypt";
import { connectToDatabase } from "@/db/db";
import { getSession } from "@/lib/auth/auth";
import { ObjectId } from "mongodb";
import { ChangePasswordSchema } from "@/schemas/schemas";

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = ChangePasswordSchema.parse(body);
    const { currentPassword, newPassword } = validatedData;

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db();

    // Get user
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.user.id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error: unknown) {
    console.error("[CHANGE_PASSWORD]", error);

    // Handle Zod validation errors
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
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
