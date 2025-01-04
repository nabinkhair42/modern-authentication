import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    console.log("Server session:", session);
    
    if (!session) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email
      },
      type: session.type,
      iat: session.iat,
      exp: session.exp
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(null);
  }
}
