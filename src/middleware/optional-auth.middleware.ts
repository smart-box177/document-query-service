import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { JWT_SECRET } from "../constant";
import { User } from "../models/user.model";

interface JwtPayload {
  user_id?: string;
  userId?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Optional auth middleware - populates req.user if valid token exists,
 * but doesn't block the request if no token or invalid token
 */
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded?.user_id || decoded?.userId;

    if (!userId) {
      return next();
    }

    const user = await User.findById(userId);

    if (user) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role || "user",
        avatar: user.avatar,
      };
    }

    next();
  } catch {
    // Silently continue without user - token might be expired or invalid
    next();
  }
};
