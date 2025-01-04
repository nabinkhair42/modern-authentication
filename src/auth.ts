import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Email from "next-auth/providers/email"
import Credentials from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { verifyPassword } from "@/lib/password"
import { SignInSchema } from "@/lib/schemas"
import client from "@/lib/db"
import { sendVerificationRequest } from "@/lib/auth-utils"
import { AuthError } from "next-auth"

if (!process.env.EMAIL_FROM) {
  throw new Error("EMAIL_FROM environment variable is not set")
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(client),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      sendVerificationRequest,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const parsedCredentials = SignInSchema.parse(credentials)
          
          const db = (await client).db("auth-db")
          const user = await db.collection("users").findOne({ 
            email: parsedCredentials.email 
          })
          
          if (!user || !user.password) {
            throw new AuthError({
              type: "CredentialsSignin",
              message: "No user found with this email"
            })
          }
          
          const isValid = await verifyPassword(
            parsedCredentials.password,
            user.password
          )
          
          if (!isValid) {
            throw new AuthError({
              type: "CredentialsSignin",
              message: "Invalid password"
            })
          }
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name
          }
        } catch (error) {
          if (error instanceof AuthError) {
            throw error
          }
          throw new AuthError({
            type: "CredentialsSignin",
            message: error instanceof Error ? error.message : "Authentication failed"
          })
        }
      }
    })
  ],
  pages: {
    signIn: "/signin",
    verifyRequest: "/verify",
    error: "/error",
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
})
