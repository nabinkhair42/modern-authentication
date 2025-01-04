export interface Session {
    user: {
      id: string
      email: string
    }
    type: string
    iat: number
    exp: number
  }