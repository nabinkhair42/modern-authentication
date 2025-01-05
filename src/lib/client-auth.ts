import { SessionResponse } from "@/types/session";

export async function getClientSession(): Promise<SessionResponse | null> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const session = await response.json();

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
