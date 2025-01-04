"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getClientSession } from "@/lib/client-auth"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getClientSession()
      console.log("Change password session:", session)
      if (!session?.user?.id) {
        router.push("/signin?callbackUrl=/settings/change-password")
        return
      }
      setIsChecking(false)
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match")
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors
        if (data.issues) {
          const messages = data.issues.map((issue: any) => issue.message)
          throw new Error(messages.join("\n"))
        }
        throw new Error(data.error || "Failed to change password")
      }

      toast.success("Password changed successfully!")
      router.push("/")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password"
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

  if (isChecking) {
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-12 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Enter your current password and choose a new password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Change Password
            </Button>
            <Link
              href="/"
              className="flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
