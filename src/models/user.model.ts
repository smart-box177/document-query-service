import { model, Model } from "mongoose";
import { Schema } from "mongoose";
import { compare, hash } from "bcrypt";
import { SALT_ROUNDS } from "../constant";
import {
  AuthProvider,
  IUser,
  IUserDocument,
  UserRole,
} from "../interfaces/user";

const userSchema = new Schema<IUserDocument, Model<IUserDocument>, IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstname: {
      type: String,
    },
    lastname: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
  },
  { timestamps: true }
);

userSchema.pre<IUserDocument>("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  if (!this.password) return false;
  return compare(candidatePassword, this.password);
};

export const User = model<IUserDocument>("user", userSchema);
