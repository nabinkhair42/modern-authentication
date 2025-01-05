"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { LogIn, Github, Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { SignInSchema } from "@/schemas/schemas"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors
        if (data.issues) {
          const messages = data.issues.map((issue: any) => issue.message)
          throw new Error(messages.join("\n"))
        }
        throw new Error(data.error || "Invalid credentials")
      }

      toast.success("Signed in successfully!")
      router.push("/")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign in"
      // Split multiple line error messages into separate toasts
      if (message.includes("\n")) {
        message.split("\n").forEach((msg) => toast.error(msg))
      } else {
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address")
      return
    }

    try {
      setIsMagicLinkLoading(true)
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link")
      }

      toast.success("Magic link sent! Please check your email.")
      router.push("/verify")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send magic link")
    } finally {
      setIsMagicLinkLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    try {
      setIsGithubLoading(true)
      window.location.href = "/api/auth/github"
    } catch (error) {
      toast.error("Failed to initiate GitHub sign in")
      setIsGithubLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-2">
      <Card className="w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button
            variant="outline"
            onClick={handleGithubSignIn}
            disabled={isGithubLoading}
          >
            {isGithubLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                Github
              </>
            )}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
          <Button
            variant="outline"
            onClick={handleMagicLink}
            disabled={isMagicLinkLoading}
          >
            {isMagicLinkLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Sign in with Email
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="hover:text-primary underline underline-offset-4"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="hover:text-primary underline underline-offset-4"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}