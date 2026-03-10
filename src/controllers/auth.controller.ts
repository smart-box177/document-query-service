import { NextFunction, Request, Response } from "express";
import { oauth2Client } from "../services/google.service";
import { createResponse } from "../helpers/response";
import { AuthProvider, IUserDocument } from "../interfaces/user";
import { User } from "../models/user.model";
import { SearchHistory } from "../models/history.model";
import { google } from "googleapis";
import { signToken, verifyEmailToken } from "../services/jwt.service";
import APIError from "../helpers/api.error";
import { sendEmail } from "../services/email.service";
import { signupEmailTemplate } from "../helpers/emails/signup";
import { resetPasswordEmailTemplate } from "../helpers/emails/reset-password";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export class AuthController {
  static async initOAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
      });
      res.json(
        createResponse({
          status: 200,
          success: true,
          message: "Auth URL generated",
          data: { authUrl },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        throw new APIError({
          message: "Authorization code is required",
          status: 400,
        });
      }

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });

      const { data: googleUser } = await oauth2.userinfo.get();

      if (!googleUser.email || !googleUser.id) {
        throw new APIError({
          message: "Failed to get user info from Google",
          status: 400,
        });
      }

      let user = await User.findOne({ googleId: googleUser.id });

      if (!user) {
        user = await User.findOne({ email: googleUser.email });

        if (user) {
          user.googleId = googleUser.id;
          user.authProvider = AuthProvider.GOOGLE;
          if (googleUser.picture) user.avatar = googleUser.picture;
          await user.save();
        } else {
          user = new User({
            email: googleUser.email,
            username: googleUser.email.split("@")[0],
            googleId: googleUser.id,
            avatar: googleUser.picture,
            firstname: googleUser.given_name,
            lastname: googleUser.family_name,
            authProvider: AuthProvider.GOOGLE,
          });
          await user.save();
        }
      }

      const payload = {
        user_id: user._id.toString(),
        email: user.email,
      };

      const accessToken = await signToken(payload);
      const refreshToken = await signToken(payload);

      // Get top 5 recent searches for this user
      const recentSearches = await SearchHistory.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("query resultsCount tab createdAt");

      res.json(
        createResponse({
          status: 200,
          success: true,
          message: "Google sign-in successful",
          data: {
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              avatar: user.avatar,
              role: user.role,
            },
            accessToken,
            refreshToken,
            recentSearches,
            googleUser,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.create(req.body) as unknown as IUserDocument;
      
      // Send verification email
      const verificationToken = await signToken({
        user_id: user?._id.toString(),
        email: user.email,
      });
      
      const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email?token=${verificationToken}`;
      
      await sendEmail({
        to: user.email,
        subject: "Welcome to NCCC Portal - Verify Your Email",
        html: signupEmailTemplate(user.username, verificationLink),
      });
      
      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "User registered successfully. Please check your email to verify your account.",
          data: user,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async signin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).orFail(() => {
        throw new APIError({ message: "User not found", status: 404 });
      });

      const isValidPassword = user.comparePassword(password);
      if (!isValidPassword) {
        throw new APIError({ message: "Invalid password", status: 401 });
      }

      const payload = {
        user_id: user._id.toString(),
        email: user.email,
      };

      const accessToken = await signToken(payload);
      const refreshToken = await signToken(payload); // In production, use different expiry

      // Get top 5 recent searches for this user
      const recentSearches = await SearchHistory.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("query resultsCount tab createdAt");

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "User logged in successfully",
          data: {
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              avatar: user.avatar,
              role: user.role,
            },
            accessToken,
            refreshToken,
            recentSearches,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async verifyAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== "string") {
        throw new APIError({ message: "Verification token is required", status: 400 });
      }
      
      // Verify the token
      const decoded = await verifyEmailToken(token);
      
      const user = await User.findOne({ _id: decoded.user_id }).orFail(() => {
        throw new APIError({ message: "User not found", status: 404 });
      });
      
      user.isEmailVerified = true;
      await user.save();
      
      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "User verified successfully",
          data: user,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email }).orFail(() => {
        throw new APIError({ message: "User not found", status: 404 });
      });
      
      // Generate password reset token
      const resetToken = await signToken({
        user_id: user._id.toString(),
        email: user.email,
      });
      
      const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
      
      await sendEmail({
        to: user.email,
        subject: "Reset Your Password - NCCC Portal",
        html: resetPasswordEmailTemplate(user.username, resetLink),
      });
      
      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Password reset link sent to your email",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        throw new APIError({ message: "Token and password are required", status: 400 });
      }
      
      // Verify the token
      const decoded = await verifyEmailToken(token);
      
      const user = await User.findOne({ _id: decoded.user_id }).orFail(() => {
        throw new APIError({ message: "User not found", status: 404 });
      });
      
      // Update password
      user.password = password;
      await user.save();
      
      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Password reset successful",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user is set by authMiddleware
      if (!req.user) {
        throw new APIError({ message: "Not authenticated", status: 401 });
      }

      // Get top 5 recent searches for this user
      const recentSearches = await SearchHistory.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("query resultsCount tab createdAt");

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "User retrieved successfully",
          data: {
            user: req.user,
            recentSearches,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

