import { NextFunction, Request, Response } from "express";
import APIError from "../helpers/api.error";
import HttpStatus from 'http-status';

export class mediaController {
  public static async uploadMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new APIError({
          message: "No file uploaded",
          status: HttpStatus.BAD_REQUEST,
        });
      }

      
    } catch (error) {
      next(error);
    }
  }
}
