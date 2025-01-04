"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getClientSession } from "@/lib/client-auth"
import { Loader2 } from "lucide-react"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getClientSession()
      if (!session?.user?.id) {
        // Get the current path for redirect after login
        const currentPath = window.location.pathname
        router.push(`/signin?callbackUrl=${currentPath}`)
        return
      }
      setIsChecking(false)
    }
    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
