import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "./authUtils";

// Extend Express Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired access token." });
  }

  req.user = decoded;
  next();
}

// Unified central error handling middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("💥 Server Error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected server error occurred.";

  res.status(status).json({
    error: message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
}
