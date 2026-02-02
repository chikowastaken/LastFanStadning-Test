import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based rate limiting
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

/**
 * Rate limiting middleware
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum requests per window
 * @param keyGenerator Function to generate rate limit key (default: uses IP + user ID)
 */
export function rateLimit(
  windowMs: number = 15 * 60 * 1000, // 15 minutes default
  maxRequests: number = 100, // 100 requests per window default
  keyGenerator?: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key for rate limiting
    const key = keyGenerator
      ? keyGenerator(req)
      : `${req.ip}-${(req as AuthRequest).user?.id || "anonymous"}`;

    const now = Date.now();
    const record = store[key];

    // Check if record exists and is still valid
    if (record && record.resetTime > now) {
      // Check if limit exceeded
      if (record.count >= maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        res.status(429).json({
          error: "Too many requests",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter,
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        });
        return;
      }

      // Increment count
      record.count++;
    } else {
      // Create new record
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    }

    // Add rate limit headers
    const currentRecord = store[key];
    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - currentRecord.count).toString());
    res.setHeader("X-RateLimit-Reset", new Date(currentRecord.resetTime).toISOString());

    next();
  };
}

/**
 * Strict rate limiter for sensitive endpoints (submit, start)
 * 20 requests per 5 minutes
 */
export const strictRateLimit = rateLimit(5 * 60 * 1000, 20, (req) => {
  const authReq = req as AuthRequest;
  return `strict-${authReq.user?.id || req.ip}`;
});

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per 15 minutes
 */
export const standardRateLimit = rateLimit(15 * 60 * 1000, 100, (req) => {
  const authReq = req as AuthRequest;
  return `standard-${authReq.user?.id || req.ip}`;
});

