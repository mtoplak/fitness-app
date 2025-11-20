import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User, UserDocument, UserRole } from "../models/User.js";

export interface AuthRequest extends Request {
  user?: UserDocument;
}

export function authenticateJwt(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { userId: string };
    User.findById(payload.userId)
      .then((user) => {
        if (!user) return res.status(401).json({ message: "Invalid token" });
        req.user = user;
        next();
      })
      .catch((err) => next(err));
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

