import { Document, Types } from "mongoose";

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

export enum UserRole {
  ADMIN = "admin",
  PCAD = "PCAD",
  USER = "user",
}

export interface IBookmark {
  applicationId: Types.ObjectId;
  bookmarkedAt: Date;
}

export interface IArchivedApplication {
  applicationId: Types.ObjectId;
  archivedAt: Date;
}

export interface IUser {
  // _id?: string;
  email: string;
  role?: UserRole;
  avatar?: string;
  signature?: string;
  username: string;
  lastLogin?: Date;
  lastname?: string;
  password?: string;
  googleId?: string;
  firstname?: string;
  bookmarks?: IBookmark[];
  isEmailVerified?: boolean;
  authProvider?: AuthProvider;
  archivedApplications?: IArchivedApplication[];
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
  comparePassword(userPassword: string): Promise<boolean>;
}
