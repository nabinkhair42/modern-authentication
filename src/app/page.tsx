"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST"
      })

      if (!response.ok) {
        throw new Error("Failed to sign out")
      }

      toast.success("Signed out successfully")
      router.push("/signin")
    } catch (error) {
      toast.error("Failed to sign out")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-12 px-4 py-8 md:max-w-6xl py-6 ">
      <div className="flex flex-col space-y-6 items-center justify-between">
        <h1 className="text-3xl font-bold">Welcome to Auth System</h1>
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="outline">Profile</Button>
          </Link>
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              "Sign out"
            )}
          </Button>
        </div>
      </div>
    </main>
  )
}
