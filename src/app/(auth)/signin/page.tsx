"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Github, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn("email", { 
        email, 
        redirect: false,
        callbackUrl: "/" 
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Verification email sent. Please check your inbox.");
        router.push("/verify");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setIsGithubLoading(true);
      await signIn("github", { 
        callbackUrl: "/",
        redirect: false 
      });
      toast.success("Signing in with GitHub...");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred with GitHub sign in"
      );
      setIsGithubLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 max-w-sm">
        <Card>
          <CardHeader className="space-y-1">
            <div className="mx-auto bg-primary/5 rounded-full p-6 mb-4 flex items-center justify-center">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your account using email or GitHub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isGithubLoading}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || isGithubLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Sign in with Email"
                )}
              </Button>
            </form>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleGithubSignIn}
              disabled={isLoading || isGithubLoading}
              className="w-full"
            >
              {isGithubLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <Link
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}