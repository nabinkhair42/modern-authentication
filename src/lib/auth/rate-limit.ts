// Basic in-memory rate limiter for authentication endpoints
// Note: For production systems, consider using Redis or a similar distributed store

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60 * 1000, maxRequests = 5) {
    this.store = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  // Clean up expired entries periodically
  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  // Check if key (e.g., IP or email) has exceeded the rate limit
  public isRateLimited(key: string): boolean {
    this.cleanup();
    
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry) {
      // First request
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return false;
    }
    
    if (now > entry.resetTime) {
      // Window expired, reset
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return false;
    }
    
    // Increment counter
    entry.count++;
    this.store.set(key, entry);
    
    // Check if over limit
    return entry.count > this.maxRequests;
  }
}

// Export instances for different authentication actions
export const loginRateLimiter = new RateLimiter(60 * 1000, 5); // 5 attempts per minute
export const registerRateLimiter = new RateLimiter(60 * 60 * 1000, 10); // 10 attempts per hour
export const passwordResetRateLimiter = new RateLimiter(60 * 60 * 1000, 3); // 3 attempts per hour

// Utility function to get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0] : 'unknown-ip').trim();
}
