import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory store for rate limiting
// In production, use Redis or another persistent store
const rateLimitRequests: Record<string, { count: number; timestamp: number }> =
  {};

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export function middleware(request: NextRequest) {
  // Only apply rate limiting to the summarize API endpoint
  if (request.nextUrl.pathname.startsWith("/api/summarize")) {
    const ip = request.ip || "anonymous";
    const now = Date.now();

    // Initialize or reset if window has passed
    if (
      !rateLimitRequests[ip] ||
      now - rateLimitRequests[ip].timestamp > RATE_LIMIT_WINDOW
    ) {
      rateLimitRequests[ip] = { count: 1, timestamp: now };
      return NextResponse.next();
    }

    // Increment request count
    rateLimitRequests[ip].count++;

    // Check if rate limit exceeded
    if (rateLimitRequests[ip].count > MAX_REQUESTS_PER_WINDOW) {
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": (
              rateLimitRequests[ip].timestamp + RATE_LIMIT_WINDOW
            ).toString(),
          },
        }
      );
    }

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set(
      "X-RateLimit-Limit",
      MAX_REQUESTS_PER_WINDOW.toString()
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      (MAX_REQUESTS_PER_WINDOW - rateLimitRequests[ip].count).toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      (rateLimitRequests[ip].timestamp + RATE_LIMIT_WINDOW).toString()
    );

    return response;
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "no-referrer-when-downgrade");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
