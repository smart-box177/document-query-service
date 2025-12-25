import { NextFunction, Request, Response } from "express";
import { createResponse } from "../helpers/response";
import { SearchHistory } from "../models/history.model";
import APIError from "../helpers/api.error";

export class HistoryController {
  // Create a new search history entry
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      const { query, resultsCount, tab } = req.body;

      if (!query) {
        throw new APIError({ message: "Query is required", status: 400 });
      }

      const history = await SearchHistory.create({
        userId,
        query,
        resultsCount: resultsCount || 0,
        tab: tab || "all",
      });

      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "Search history saved",
          data: history,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get user's search history
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      const { page = 1, limit = 50 } = req.query;

      const history = await SearchHistory.find({ userId })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await SearchHistory.countDocuments({ userId });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Search history retrieved",
          data: {
            history,
            total,
            page: Number(page),
            limit: Number(limit),
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Delete a single history entry
  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      const { id } = req.params;

      const history = await SearchHistory.findOneAndDelete({
        _id: id,
        userId,
      });

      if (!history) {
        throw new APIError({ message: "History entry not found", status: 404 });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "History entry deleted",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Clear all history for user
  public static async clearAll(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      const result = await SearchHistory.deleteMany({ userId });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: `Cleared ${result.deletedCount} history entries`,
          data: { deletedCount: result.deletedCount },
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
