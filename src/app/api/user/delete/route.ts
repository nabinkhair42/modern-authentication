import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import { connectToDatabase } from "@/db/db";
import { DeleteUserSchema } from "@/schemas/schemas";
import { getServerSession } from "@/lib/auth/session";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = DeleteUserSchema.parse(body);
    const { password } = validatedData;

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db();

    // Get user
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.user.id) });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // For users with password authentication, verify password
    if (user.password) {
      const isValid = await compare(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 400 }
        );
      }
    }

    // Delete user
    await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(session.user.id) });

    // Clear session cookie
    cookies().delete(process.env.COOKIE_NAME!);

    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error: unknown) {
    console.error("[DELETE_USER]", error);

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
