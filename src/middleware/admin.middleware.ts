import { Request, Response, NextFunction } from "express";
import APIError from "../helpers/api.error";

/**
 * Middleware to check if user is an admin
 * Must be used after authenticateUser middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(
      new APIError({
        message: "Authentication required",
        status: 401,
      })
    );
  }

  if (req.user.role !== "admin") {
    return next(
      new APIError({
        message: "Admin access required",
        status: 403,
      })
    );
  }

  next();
};
