"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getClientSession } from "@/lib/auth/client-auth";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getClientSession();
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
      }
    };
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to sign out");
      }
      toast.success("Signed out successfully");
      setIsAuthenticated(false);
      setUserEmail(null);
      router.push("/signin");
    } catch (error) {
      toast.error("Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-12 px-4 py-8 md:max-w-6xl py-6 ">
      <div className="flex flex-col items-center gap-4">
        {userEmail && (
          <p className="text-muted-foreground">Welcome, {userEmail}</p>
        )}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/profile">
                <Button variant="outline">Profile</Button>
              </Link>
              <Link href="/settings/change-password">
                <Button variant="outline">Change Password</Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button variant="default">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
