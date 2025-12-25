import { Request, Response, NextFunction } from "express";
import { verify, TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { JWT_SECRET } from "../constant";
import APIError from "../helpers/api.error";
import { User } from "../models/user.model";
import HttpStatus from 'http-status';

interface JwtPayload {
  user_id?: string;
  userId?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: string;
        avatar?: string;
      };
    }
  }
}

/*
 * Middleware to authenticate user based on JWT token
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new APIError({
        message: "Authentication required. Please provide a valid token.",
        status: 401,
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new APIError({
        message: "Invalid token format",
        status: 401,
      });
    }

    let decoded: JwtPayload;
    try {
      decoded = verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new APIError({
          message: "Token has expired",
          status: 401,
        });
      }
      if (err instanceof JsonWebTokenError) {
        throw new APIError({
          message: "Invalid token",
          status: 401,
        });
      }
      throw err;
    }

    // Handle both payload formats: user_id (from signin) and userId (from Google signin)
    const userId = decoded?.user_id || decoded?.userId;

    if (!userId) {
      throw new APIError({
        message: "Invalid token payload",
        status: 401,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new APIError({
        message: "User not found",
        status: 401,
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || "user",
      avatar: user.avatar,
    };

    next();
  } catch (error) {
    if (error instanceof APIError) {
      next(error);
    } else {
      next(
        new APIError({
          message: "Authentication failed",
          status: 401,
        })
      );
    }
  }
};
