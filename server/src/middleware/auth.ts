import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../services/supabase";

/**
 * Extended Request type with user info
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

/**
 * Authentication middleware
 * Validates JWT token from Authorization header
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    // Extract token (Bearer <token>)
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: "Token required" });
      return;
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error("Auth error:", error?.message || "No user found");
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Optional auth middleware
 * Attaches user if token is valid, but doesn't require auth
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");

      if (token) {
        const {
          data: { user },
        } = await supabaseAdmin.auth.getUser(token);

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
}

/**
 * Admin-only middleware
 * Requires user to have admin role
 */
export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // First ensure authenticated
  await requireAuth(req, res, async () => {
    if (!req.user) {
      return; // requireAuth already sent response
    }

    try {
      // Check if user has admin role
      const { data: roleData, error } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", req.user.id)
        .eq("role", "admin")
        .single();

      if (error || !roleData) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      req.user.role = "admin";
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ error: "Authorization failed" });
    }
  });
}
