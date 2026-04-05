import { NextFunction, Request, Response } from "express";
import { createResponse } from "../helpers/response";
import { User } from "../models/user.model";
import APIError from "../helpers/api.error";
import { removeBackgroundFromImageUrl } from "remove.bg";
import { REMOVE_BG_API_KEY, JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRY } from "../constant";
import { sign } from "jsonwebtoken";
import type { SignatureTokenPayload } from "../interfaces/params";

export class UserController {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.find()
        .select("-password -bookmarks -archivedApplications")
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

      if (!["user", "admin", "PCAD"].includes(role)) {
        throw new APIError({ message: "Invalid role. Allowed roles: user, admin, PCAD", status: 400 });
      }

      // Prevent admin from removing their own admin role
      if (req.user?.id === id && req.user?.role === "admin" && role !== "admin") {
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
        .select("-password -bookmarks -archivedApplications")
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
      const pcadCount = await User.countDocuments({ role: "PCAD" });
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
            pcadCount,
            userCount,
            recentUsers,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError({ message: "Not authenticated", status: 401 });
      }

      const { username, email, signature, avatar } = req.body;
      const updateData: any = {};
      
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (signature !== undefined) updateData.signature = signature;
      if (avatar !== undefined) updateData.avatar = avatar;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true }
      )
        .select("-password")
        .orFail(() => {
          throw new APIError({ message: "User not found", status: 404 });
        });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Profile updated successfully",
          data: user,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove background from signature image
   */
  static async removeSignatureBackground(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError({ message: "Not authenticated", status: 401 });
      }

      const { imageUrl } = req.body;

      if (!imageUrl) {
        throw new APIError({ message: "Image URL is required", status: 400 });
      }

      if (!REMOVE_BG_API_KEY) {
        throw new APIError({ message: "Background removal API key not configured", status: 500 });
      }

      const result = await removeBackgroundFromImageUrl({
        url: imageUrl,
        apiKey: REMOVE_BG_API_KEY,
        size: "regular",
        type: "auto",
        format: "png",
      });

      // result.base64img contains the processed image as base64 string
      const base64Image = `data:image/png;base64,${result.base64img}`;

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Background removed successfully",
          data: {
            processedImage: base64Image,
          },
        })
      );
    } catch (error) {
      console.error("Remove BG error:", error);
      next(new APIError({ message: "Failed to remove background from image", status: 500 }));
    }
  }

  /**
   * Sign a declaration with the authenticated user's credentials.
   * Returns a short-lived JWT that proves the logged-in user attached
   * this signature URL at this point in time.
   */
  static async signDeclaration(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError({ message: "Not authenticated", status: 401 });
      }

      const { signatureUrl, role } = req.body as { signatureUrl?: string; role?: string };

      if (!signatureUrl) {
        throw new APIError({ message: "signatureUrl is required", status: 400 });
      }

      if (!role || !["operator", "serviceProvider"].includes(role)) {
        throw new APIError({
          message: "role must be 'operator' or 'serviceProvider'",
          status: 400,
        });
      }

      const user = await User.findById(req.user.id)
        .select("username email role")
        .orFail(() => new APIError({ message: "User not found", status: 404 }));

      if (!JWT_ACCESS_SECRET) {
        throw new APIError({ message: "Server misconfiguration", status: 500 });
      }

      const payload: SignatureTokenPayload = {
        user_id: String(user._id),
        email: user.email ?? "",
        username: user.username,
        signatureUrl,
        signedAt: new Date().toISOString(),
        role,
      };

      // Expire in 1 year — the token is an audit record, not a session token
      const token = sign(payload, JWT_ACCESS_SECRET, { expiresIn: "365d" });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Declaration signed successfully",
          data: { token },
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
