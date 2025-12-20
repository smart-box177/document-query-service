import { google } from "googleapis";
import {
  REDIRECT_URI,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "../constant";

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);
