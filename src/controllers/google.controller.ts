import { NextFunction, Request, Response } from "express";
import { oauth2Client } from "../services/google.service";
import { createResponse } from "../helpers/response";

export default class googleController {
  static async initOAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const auth_url = oauth2Client.generateAuthUrl();
    } catch (error) {
      next(error);
    }
  }
}
