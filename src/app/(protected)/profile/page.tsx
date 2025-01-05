"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Sparkles, Shield, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Progress
} from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserProfile } from "@/types/auth.types"

interface AIInsights {
  completenessScore: number;
  suggestions: string[];
  securityTips: string[];
}

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchAIInsights()
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }
      const data = await response.json()
      setProfile(data)
      setName(data.name)
    } catch (error) {
      toast.error("Failed to load profile")
      router.push("/")
    }
  }

  const fetchAIInsights = async () => {
    if (!profile) return
    setIsLoadingInsights(true)
    try {
      const response = await fetch("/api/ai/profile-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          createdAt: profile.createdAt,
        }),
      })
      if (!response.ok) throw new Error("Failed to fetch AI insights")
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error("Failed to fetch AI insights:", error)
    } finally {
      setIsLoadingInsights(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      await fetchProfile()
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete account")
      }

      toast.success("Account deleted successfully")
      router.push("/signin")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setPassword("")
    }
  }

  if (!profile) {
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            View and manage your profile information
          </CardDescription>
        </CardHeader>
        {isEditing ? (
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        ) : (
          <>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <p className="text-sm text-muted-foreground">{profile.name}</p>
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>

      {/* AI Insights Card */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <CardTitle>AI Insights</CardTitle>
          </div>
          <CardDescription>
            Personalized insights and suggestions for your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingInsights ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : insights ? (
            <>
              {/* Profile Completeness */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Profile Completeness</span>
                  <span>{insights.completenessScore}%</span>
                </div>
                <Progress value={insights.completenessScore} />
              </div>

              {/* AI Suggestions */}
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Profile Suggestions</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {insights.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm">{suggestion}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Security Tips */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Security Tips</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {insights.securityTips.map((tip, index) => (
                      <li key={index} className="text-sm">{tip}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Failed to load AI insights
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Confirm your password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setPassword("")
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!password || isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
