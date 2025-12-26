import { Document, Types } from "mongoose";

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface IBookmark {
  contractId: Types.ObjectId;
  bookmarkedAt: Date;
}

export interface IUser {
  email: string;
  username: string;
  role?: UserRole;
  avatar?: string;
  lastname?: string;
  password?: string;
  googleId?: string;
  lastLogin?: Date;
  firstname?: string;
  isEmailVerified?: boolean;
  authProvider?: AuthProvider;
  bookmarks?: IBookmark[];
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
  comparePassword(userPassword: string): Promise<boolean>;
}
