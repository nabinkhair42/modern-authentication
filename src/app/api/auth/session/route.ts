import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { SessionResponse } from "@/types/session";

export async function GET(): Promise<NextResponse<SessionResponse | null>> {
  try {
    const session = await getServerSession();

    console.log("[SESSION_API]", session);
    
    if (!session) {
      return new NextResponse(JSON.stringify(null), {
        headers: {
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
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

    return new NextResponse(JSON.stringify(sessionResponse), {
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error("[SESSION_API]", error);
    return new NextResponse(JSON.stringify(null), {
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}
