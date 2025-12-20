import { NextFunction, Request, Response } from "express";
import { oauth2Client } from "../services/google.service";
import { createResponse } from "../helpers/response";
import { AuthProvider } from "../interfaces/user";
import { User } from "../models/user.model";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import {
  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRY,
  JWT_SECRET,
  JWT_EXPIRY,
} from "../constant";

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
        return res.status(400).json(
          createResponse({
            status: 400,
            success: false,
            message: "Authorization code is required",
          })
        );
      }

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });

      const { data: googleUser } = await oauth2.userinfo.get();

      if (!googleUser.email || !googleUser.id) {
        return res.status(400).json(
          createResponse({
            status: 400,
            success: false,
            message: "Failed to get user info from Google",
          })
        );
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
          user = await User.create({
            username: googleUser.email.split("@")[0],
            email: googleUser.email,
            googleId: googleUser.id,
            avatar: googleUser.picture,
            firstname: googleUser.given_name,
            lastname: googleUser.family_name,
            authProvider: AuthProvider.GOOGLE,
          });
        }
      }

      const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRY as jwt.SignOptions["expiresIn"],
      });
      const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRY as jwt.SignOptions["expiresIn"],
      });

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
            googleUser
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
