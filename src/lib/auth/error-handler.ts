import { ZodError } from "zod";
import { NextResponse } from "next/server";

export type ErrorResponse = {
  error: string;
  details?: unknown;
};

export function handleApiError(error: unknown, debugInfo?: string): NextResponse<ErrorResponse> {
  // Log the error with context for debugging
  console.error(`[${debugInfo || "API_ERROR"}]`, error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // Handle known error types with custom messages
  if (error instanceof Error) {
    // Check for specific known errors
    if (error.message.includes("duplicate key") || error.message.includes("already exists")) {
      return NextResponse.json(
        { error: "Resource already exists" },
        { status: 409 }
      );
    }

    // Token or JWT errors
    if (error.message.includes("jwt") || error.message.includes("token")) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Return the actual error message for other known errors
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Default case for unknown errors
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

export function redirectWithError(baseUrl: string, error: string): NextResponse {
  const url = new URL(baseUrl);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}
