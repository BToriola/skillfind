// Simple in-memory rate limiter
// Limits each IP to a max number of requests per time window

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

type RateLimitOptions = {
  maxRequests: number;   // max requests allowed
  windowMs: number;      // time window in milliseconds
};

export function rateLimit(ip: string, options: RateLimitOptions): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const entry = store.get(ip);

  // If no entry or window has expired, create a fresh one
  if (!entry || now > entry.resetAt) {
    store.set(ip, {
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
  store.set(ip, entry);

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
