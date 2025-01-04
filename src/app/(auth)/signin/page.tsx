"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Github, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { SignInSchema } from "@/lib/schemas";
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
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input
      const data = SignInSchema.parse({ email, password });

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result) {
        throw new Error("Authentication failed. Please try again.");
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Signed in successfully!");
      router.push("/");
    } catch (error) {
      let errorMessage = "Authentication failed";
      
      if (error instanceof Error) {
        // Extract error message from the error
        errorMessage = error.message;
        
        // Clean up the error message if it's from next-auth
        if (errorMessage.includes("CredentialsSignin")) {
          errorMessage = errorMessage.split('"message":"')[1]?.split('"')[0] || errorMessage;
        }
      }
      
      toast.error(errorMessage, {
        description: "Please check your credentials and try again"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address first");
      return;
    }

    setIsMagicLinkLoading(true);
    try {
      // Check if email exists
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const { exists, error } = await checkResponse.json();
      
      if (error) throw new Error(error);
      
      if (!exists) {
        toast.error("No account found with this email. Please sign up first.");
        return;
      }

      const result = await signIn("email", { 
        email, 
        redirect: false,
        callbackUrl: "/" 
      });
      if (result?.error) {
        throw new Error(result.error);
      }
      toast.success("Magic link sent! Please check your inbox.");
      router.push("/verify");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send magic link"
      );
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setIsGithubLoading(true);
      await signIn("github", { 
        callbackUrl: "/",
        redirect: false 
      });
      toast.success("Connecting to GitHub...");
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
              Sign in to your account using your preferred method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isMagicLinkLoading || isGithubLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isMagicLinkLoading || isGithubLoading}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || isMagicLinkLoading || isGithubLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in with Password"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleMagicLink}
                disabled={isLoading || isMagicLinkLoading || isGithubLoading}
              >
                {isMagicLinkLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Sign in with Magic Link
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleGithubSignIn}
                disabled={isLoading || isMagicLinkLoading || isGithubLoading}
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
            </div>
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