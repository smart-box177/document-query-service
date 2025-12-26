import { NextFunction, Request, Response } from "express";
import { createResponse } from "../helpers/response";
import { User } from "../models/user.model";
import APIError from "../helpers/api.error";

export class UserController {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.find()
        .select("-password -bookmarks -archivedContracts")
        .sort({ createdAt: -1 });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Users retrieved successfully",
          data: users,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   */
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await User.findById(id)
        .select("-password")
        .orFail(() => {
          throw new APIError({ message: "User not found", status: 404 });
        });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "User retrieved successfully",
          data: user,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["user", "admin"].includes(role)) {
        throw new APIError({ message: "Invalid role", status: 400 });
      }

      // Prevent admin from removing their own admin role
      if (req.user?.id === id && role !== "admin") {
        throw new APIError({
          message: "You cannot remove your own admin privileges",
          status: 400,
        });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      )
        .select("-password -bookmarks -archivedContracts")
        .orFail(() => {
          throw new APIError({ message: "User not found", status: 404 });
        });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: `User role updated to ${role}`,
          data: user,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        throw new APIError({
          message: "You cannot delete your own account from admin panel",
          status: 400,
        });
      }

      const user = await User.findByIdAndDelete(id).orFail(() => {
        throw new APIError({ message: "User not found", status: 404 });
      });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "User deleted successfully",
          data: { id: user._id },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user stats (admin only)
   */
  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const totalUsers = await User.countDocuments();
      const adminCount = await User.countDocuments({ role: "admin" });
      const userCount = await User.countDocuments({ role: "user" });

      const recentUsers = await User.find()
        .select("username email createdAt")
        .sort({ createdAt: -1 })
        .limit(5);

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "User stats retrieved successfully",
          data: {
            totalUsers,
            adminCount,
            userCount,
            recentUsers,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
