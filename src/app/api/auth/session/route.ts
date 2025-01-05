import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { SessionResponse } from "@/types/session";

export async function GET(): Promise<NextResponse<SessionResponse | null>> {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(null);
    }

    const sessionResponse: SessionResponse = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      expires: session.expires.toISOString(),
      isLoggedIn: true,
    };

    return NextResponse.json(sessionResponse);
  } catch (error) {
    console.error("[SESSION_API]", error);
    return NextResponse.json(null);
  }
}
