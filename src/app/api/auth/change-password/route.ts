import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { changePassword } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  try {
    if (!session.user.id) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }
    await changePassword(session.user.id, currentPassword, newPassword);
    return NextResponse.json({ message: "Password changed successfully" });
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
