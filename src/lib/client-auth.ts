import { Session, SessionResponse } from "@/types/api.types"

export async function getClientSession(): Promise<SessionResponse | null> {
  try {
    const response = await fetch("/api/auth/session")
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Failed to get client session:", error)
    return null
  }
}
