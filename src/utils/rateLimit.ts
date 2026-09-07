// Simple in-memory rate limiter
// Limits each IP to a max number of requests per time window, per scope.

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

type RateLimitOptions = {
  /**
   * Names the bucket, and is required for a reason: the store is one Map, so
   * every route that keyed on the bare IP was drawing down a single shared
   * budget. Twenty smart-searches would leave a freelancer unable to generate
   * a bio, with a "too many requests" message about a limit they never hit.
   * Scoping keys per route keeps each route's ceiling its own, and making the
   * field mandatory means a new route can't quietly rejoin the shared pool.
   */
  scope: string;
  maxRequests: number;   // max requests allowed, per scope per IP
  windowMs: number;      // time window in milliseconds
};

export function rateLimit(ip: string, options: RateLimitOptions): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const key = `${options.scope}:${ip}`;
  const entry = store.get(key);

  // If no entry or window has expired, create a fresh one
  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetIn: options.windowMs,
    };
  }

  // Within window — check count
  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  // Increment count
  entry.count += 1;
  store.set(key, entry);

  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetIn: entry.resetAt - now,
  };
}

// Clean up expired entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key);
  });
}, 10 * 60 * 1000);
