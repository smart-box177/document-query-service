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

/**
 * Middleware to check if user has the PCAD role.
 * PCAD (Principal Compliance Approval Desk) users are the only ones
 * authorised to approve, reject, or request revisions on applications.
 * Must be used after authenticateUser middleware.
 */
export const requirePCAD = (
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

  if (req.user.role !== "PCAD") {
    return next(
      new APIError({
        message: "PCAD access required. Only authorised compliance officers can review applications.",
        status: 403,
      })
    );
  }

  next();
};
