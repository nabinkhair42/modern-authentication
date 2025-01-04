"use client";

import { Mail, ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Verify() {
  const handleGmailClick = () => {
    window.open("https://mail.google.com", "_blank");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 max-w-sm">
        <Card>
          <CardHeader className="space-y-1">
            <div className="mx-auto bg-primary/5 rounded-full p-6 mb-4 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">
              Check your email
            </CardTitle>
            <CardDescription className="text-center">
              We&apos;ve sent you a verification link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Click the link in the email to verify your account.</p>
              <p className="mt-2">If you don&apos;t see it, check your spam folder.</p>
            </div>
            <Button 
              onClick={handleGmailClick}
              className="w-full"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Gmail
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              You can close this window after verifying your email
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}