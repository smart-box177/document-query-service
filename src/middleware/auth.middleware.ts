import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { JWT_SECRET } from "../constant";
import APIError from "../helpers/api.error";
import { User } from "../models/user.model";

interface JwtPayload {
  user_id?: string;
  userId?: string;
  email?: string;
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

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new APIError({
        message: "No token provided",
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

    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.user_id || decoded.userId;

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
      role: user.role!,
      avatar: user.avatar,
    };

    next();
  } catch (error) {
    if (error instanceof APIError) {
      next(error);
    } else {
      next(
        new APIError({
          message: "Invalid or expired token",
          status: 401,
        })
      );
    }
  }
};
