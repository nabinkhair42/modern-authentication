import { Session } from "@/types/api.types"

export async function getClientSession(): Promise<Session | null> {
  try {
    const response = await fetch('/api/auth/session')
    if (!response.ok) {
      return null
    }
    const session = await response.json()
    console.log("Client session:", session)
    return session
  } catch (error) {
    console.error('Error getting client session:', error)
    return null
  }
}
