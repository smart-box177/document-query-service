import { NextFunction, Request, Response } from "express";
import { createResponse } from "../helpers/response";
import { Contract } from "../models/contract.model";
import { Media } from "../models/media.model";
import { SearchHistory } from "../models/history.model";
import { User } from "../models/user.model";
import APIError from "../helpers/api.error";

export class ContractController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await Contract.create(req.body);
      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "Contract created successfully",
          data: contract,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 10,
        operator,
        year,
        contractorName,
        hasDocument,
      } = req.query;
      const query: Record<string, unknown> = {};

      if (operator) query.operator = operator;
      if (year) query.year = Number(year);
      if (contractorName)
        query.contractorName = { $regex: contractorName, $options: "i" };
      if (hasDocument !== undefined) query.hasDocument = hasDocument === "true";

      const contracts = await Contract.find(query)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Contract.countDocuments(query);

      const contractIds = contracts.map((c) => c._id);
      const media = await Media.find({
        contractId: { $in: contractIds },
        isDeleted: false,
      }).select("url filename originalName mimetype size contractId");

      const contractsWithMedia = contracts.map((contract) => ({
        ...contract.toObject(),
        media: media.filter(
          (m) => m.contractId?.toString() === contract._id.toString()
        ),
      }));

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contracts retrieved successfully",
          data: {
            contracts: contractsWithMedia,
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

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const contract = await Contract.findById(id).orFail(() => {
        throw new APIError({ message: "Contract not found", status: 404 });
      });

      const media = await Media.find({
        contractId: id,
        isDeleted: false,
      }).select("url filename originalName mimetype size");

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contract retrieved successfully",
          data: { ...contract.toObject(), media },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const contract = await Contract.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      }).orFail(() => {
        throw new APIError({ message: "Contract not found", status: 404 });
      });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contract updated successfully",
          data: contract,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await Contract.findByIdAndDelete(id).orFail(() => {
        throw new APIError({ message: "Contract not found", status: 404 });
      });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contract deleted successfully",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, tab = "all" } = req.query;

      if (!q) {
        throw new APIError({
          message: "Search query is required",
          status: 400,
        });
      }

      const searchQuery = String(q);
      const contracts = await Contract.find({
        $or: [
          { contractTitle: { $regex: searchQuery, $options: "i" } },
          { contractorName: { $regex: searchQuery, $options: "i" } },
          { operator: { $regex: searchQuery, $options: "i" } },
          { contractNumber: { $regex: searchQuery, $options: "i" } },
        ],
      }).limit(20);

      const contractIds = contracts.map((c) => c._id);
      const media = await Media.find({
        contractId: { $in: contractIds },
        isDeleted: false,
      }).select("url filename originalName mimetype size contractId");

      const contractsWithMedia = contracts.map((contract) => ({
        ...contract.toObject(),
        media: media.filter(
          (m) => m.contractId?.toString() === contract._id.toString()
        ),
      }));

      // Save search history if user is authenticated
      if (req.user?.id) {
        await SearchHistory.create({
          userId: req.user.id,
          query: searchQuery,
          resultsCount: contracts.length,
          tab: String(tab),
        }).catch(() => {
          // Silently fail - history is not critical
        });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Search results retrieved successfully",
          data: contractsWithMedia,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Get user's search history
  public static async getSearchHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
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
  public static async deleteSearchHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      const { historyId } = req.params;

      const history = await SearchHistory.findOneAndDelete({
        _id: historyId,
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

  // Clear all search history for user
  public static async clearSearchHistory(
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

  // Get user's bookmarks with contract details
  public static async getBookmarks(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      const user = await User.findById(userId).select("bookmarks");
      if (!user) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      const bookmarks = user.bookmarks || [];
      const contractIds = bookmarks.map((b) => b.contractId);

      // Get contract details for all bookmarks
      const contracts = await Contract.find({ _id: { $in: contractIds } });

      // Map bookmarks with contract details
      const bookmarksWithDetails = bookmarks
        .map((bookmark) => {
          const contract = contracts.find(
            (c) => c._id.toString() === bookmark.contractId.toString()
          );
          if (!contract) return null;
          return {
            id: contract._id,
            contractTitle: contract.contractTitle,
            operator: contract.operator,
            contractorName: contract.contractorName,
            contractNumber: contract.contractNumber,
            year: contract.year,
            contractValue: contract.contractValue,
            bookmarkedAt: bookmark.bookmarkedAt,
          };
        })
        .filter(Boolean);

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Bookmarks retrieved",
          data: {
            bookmarks: bookmarksWithDetails,
            total: bookmarksWithDetails.length,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Add a bookmark
  public static async addBookmark(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      const { contractId } = req.params;

      // Verify contract exists
      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new APIError({ message: "Contract not found", status: 404 });
      }

      // Check if already bookmarked
      const user = await User.findById(userId);
      if (!user) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      const existingBookmark = user.bookmarks?.find(
        (b) => b.contractId.toString() === contractId
      );

      if (existingBookmark) {
        throw new APIError({
          message: "Contract already bookmarked",
          status: 400,
        });
      }

      // Add bookmark
      await User.findByIdAndUpdate(userId, {
        $push: {
          bookmarks: {
            contractId,
            bookmarkedAt: new Date(),
          },
        },
      });

      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "Contract bookmarked",
          data: {
            contractId,
            contractTitle: contract.contractTitle,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Remove a bookmark
  public static async removeBookmark(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      const { contractId } = req.params;

      const result = await User.findByIdAndUpdate(userId, {
        $pull: {
          bookmarks: { contractId },
        },
      });

      if (!result) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Bookmark removed",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Clear all bookmarks
  public static async clearBookmarks(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      await User.findByIdAndUpdate(userId, {
        $set: { bookmarks: [] },
      });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "All bookmarks cleared",
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
