import { SessionResponse } from "@/types/session";

export async function getClientSession(): Promise<SessionResponse | null> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",  // Add this to include cookies
    });

    if (!response.ok) {
      return null;
    }

    const session = await response.json();
    
    // If session is null, return null
    if (!session) {
      return null;
    }

    // Check if session has user property
    if (!session.user) {
      console.error("[GET_CLIENT_SESSION] Invalid session format:", session);
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      expires: session.expires,
      isLoggedIn: true,
    };
  } catch (error) {
    console.error("[GET_CLIENT_SESSION]", error);
    return null;
  }
}
