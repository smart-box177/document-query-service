import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { createResponse } from "../helpers/response";
import { Contract } from "../models/contract.model";
import { Media } from "../models/media.model";
import { SearchHistory } from "../models/history.model";
import { User } from "../models/user.model";
import APIError from "../helpers/api.error";

export class ContractController {
  /**
   * Parse year and month from search query
   * Supports formats like: "2024", "June 2024", "2024 June", "Jun 2024", "06/2024"
   */
  private static parseDateFromQuery(query: string): {
    cleanQuery: string;
    year?: number;
    month?: number;
  } {
    const monthNames: Record<string, number> = {
      january: 1,
      jan: 1,
      february: 2,
      feb: 2,
      march: 3,
      mar: 3,
      april: 4,
      apr: 4,
      may: 5,
      june: 6,
      jun: 6,
      july: 7,
      jul: 7,
      august: 8,
      aug: 8,
      september: 9,
      sep: 9,
      sept: 9,
      october: 10,
      oct: 10,
      november: 11,
      nov: 11,
      december: 12,
      dec: 12,
    };

    let cleanQuery = query;
    let year: number | undefined;
    let month: number | undefined;

    // Match numeric month format first (01/2024, 1/2024, 01-2024)
    const numericMonthMatch = query.match(/\b(\d{1,2})[\/\-](20\d{2})\b/);
    if (numericMonthMatch) {
      const parsedMonth = parseInt(numericMonthMatch[1], 10);
      if (parsedMonth >= 1 && parsedMonth <= 12) {
        month = parsedMonth;
        year = parseInt(numericMonthMatch[2], 10);
        cleanQuery = cleanQuery.replace(numericMonthMatch[0], "").trim();
      }
    }

    // Match year (4 digits between 2000-2099) if not already found
    if (!year) {
      const yearMatch = cleanQuery.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
        cleanQuery = cleanQuery.replace(yearMatch[0], "").trim();
      }
    }

    // Match month name
    const monthPattern = new RegExp(
      `\\b(${Object.keys(monthNames).join("|")})\\b`,
      "i"
    );
    const monthMatch = cleanQuery.match(monthPattern);
    if (monthMatch) {
      month = monthNames[monthMatch[1].toLowerCase()];
      cleanQuery = cleanQuery.replace(monthMatch[0], "").trim();
    }

    // Clean up extra spaces
    cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();

    return { cleanQuery, year, month };
  }

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

      const originalQuery = String(q);

      // Parse year and month from query
      const { cleanQuery, year, month } =
        ContractController.parseDateFromQuery(originalQuery);

      // Get user's archived contracts to exclude from results
      let userArchivedIds: string[] = [];
      if (req.user?.id) {
        const user = await User.findById(req.user.id).select(
          "archivedContracts"
        );
        userArchivedIds = (user?.archivedContracts || []).map((a) =>
          a.contractId.toString()
        );
      }

      // Build date filter for year/month search
      const dateFilter: Record<string, unknown> = {};
      if (year) {
        const searchMonth = month ? month - 1 : 0; // 0-indexed month

        // Calculate the search date range
        let rangeStart: Date;
        let rangeEnd: Date;

        if (month) {
          // Specific month: first day to last day of that month
          rangeStart = new Date(year, searchMonth, 1);
          rangeEnd = new Date(year, searchMonth + 1, 0, 23, 59, 59, 999);
        } else {
          // Entire year: Jan 1 to Dec 31
          rangeStart = new Date(year, 0, 1);
          rangeEnd = new Date(year, 11, 31, 23, 59, 59, 999);
        }

        // Find contracts where the contract period overlaps with the search range
        dateFilter.$and = [
          { startDate: { $lte: rangeEnd } },
          { endDate: { $gte: rangeStart } },
        ];
      }

      // Build text search - only if there's text after removing date parts
      const textSearchConditions = cleanQuery
        ? {
            $or: [
              { contractTitle: { $regex: cleanQuery, $options: "i" } },
              { contractorName: { $regex: cleanQuery, $options: "i" } },
              { operator: { $regex: cleanQuery, $options: "i" } },
              { contractNumber: { $regex: cleanQuery, $options: "i" } },
            ],
          }
        : {};

      const contracts = await Contract.find({
        isArchived: false, // Exclude globally archived contracts
        ...(userArchivedIds.length > 0 && { _id: { $nin: userArchivedIds } }), // Exclude user's archived
        ...dateFilter,
        ...textSearchConditions,
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
          query: originalQuery,
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

  // ==================== USER ARCHIVE METHODS ====================

  // Get user's archived contracts
  public static async getUserArchive(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new APIError({ message: "Unauthorized", status: 401 });
      }

      const user = await User.findById(userId).select("archivedContracts");
      if (!user) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      const archivedContracts = user.archivedContracts || [];
      const contractIds = archivedContracts.map((a) => a.contractId);

      const contracts = await Contract.find({ _id: { $in: contractIds } });

      const archiveWithDetails = archivedContracts
        .map((archived) => {
          const contract = contracts.find(
            (c) => c._id.toString() === archived.contractId.toString()
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
            archivedAt: archived.archivedAt,
          };
        })
        .filter(Boolean);

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "User archive retrieved",
          data: {
            archived: archiveWithDetails,
            total: archiveWithDetails.length,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Archive a contract for user (hide from their search results)
  public static async archiveForUser(
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

      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new APIError({ message: "Contract not found", status: 404 });
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      const existingArchive = user.archivedContracts?.find(
        (a) => a.contractId.toString() === contractId
      );

      if (existingArchive) {
        throw new APIError({
          message: "Contract already archived",
          status: 400,
        });
      }

      await User.findByIdAndUpdate(userId, {
        $push: {
          archivedContracts: {
            contractId,
            archivedAt: new Date(),
          },
        },
      });

      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "Contract archived",
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

  // Restore a contract from user's archive
  public static async restoreForUser(
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
          archivedContracts: { contractId },
        },
      });

      if (!result) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contract restored from archive",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Clear all user's archived contracts
  public static async clearUserArchive(
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
        $set: { archivedContracts: [] },
      });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "User archive cleared",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== ADMIN ARCHIVE METHODS ====================

  // Get all globally archived contracts (admin only)
  public static async getGlobalArchive(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { page = 1, limit = 50 } = req.query;

      const contracts = await Contract.find({ isArchived: true })
        .populate("archivedBy", "username firstname lastname")
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ archivedAt: -1 });

      const total = await Contract.countDocuments({ isArchived: true });

      const archiveData = contracts.map((contract) => ({
        id: contract._id,
        contractTitle: contract.contractTitle,
        operator: contract.operator,
        contractorName: contract.contractorName,
        contractNumber: contract.contractNumber,
        year: contract.year,
        contractValue: contract.contractValue,
        archivedAt: contract.archivedAt,
        archivedBy: contract.archivedBy,
      }));

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Global archive retrieved",
          data: {
            archived: archiveData,
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

  // Archive a contract globally (admin only)
  public static async archiveGlobally(
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

      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new APIError({ message: "Contract not found", status: 404 });
      }

      if (contract.isArchived) {
        throw new APIError({
          message: "Contract is already archived",
          status: 400,
        });
      }

      contract.isArchived = true;
      contract.archivedAt = new Date();
      contract.archivedBy = new Types.ObjectId(userId);
      await contract.save();

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contract archived globally",
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

  // Restore a globally archived contract (admin only)
  public static async restoreGlobally(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { contractId } = req.params;

      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new APIError({ message: "Contract not found", status: 404 });
      }

      if (!contract.isArchived) {
        throw new APIError({
          message: "Contract is not archived",
          status: 400,
        });
      }

      contract.isArchived = false;
      contract.archivedAt = undefined;
      contract.archivedBy = undefined;
      await contract.save();

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contract restored from global archive",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Permanently delete an archived contract (admin only)
  public static async permanentlyDelete(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { contractId } = req.params;

      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new APIError({ message: "Contract not found", status: 404 });
      }

      if (!contract.isArchived) {
        throw new APIError({
          message: "Contract must be archived before permanent deletion",
          status: 400,
        });
      }

      await Contract.findByIdAndDelete(contractId);

      // Also remove from all users' bookmarks and archives
      await User.updateMany(
        {},
        {
          $pull: {
            bookmarks: { contractId },
            archivedContracts: { contractId },
          },
        }
      );

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contract permanently deleted",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Empty global archive - permanently delete all archived contracts (admin only)
  public static async emptyGlobalArchive(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const archivedContracts = await Contract.find({
        isArchived: true,
      }).select("_id");
      const contractIds = archivedContracts.map((c) => c._id);

      await Contract.deleteMany({ isArchived: true });

      // Remove from all users' bookmarks and archives
      await User.updateMany(
        {},
        {
          $pull: {
            bookmarks: { contractId: { $in: contractIds } },
            archivedContracts: { contractId: { $in: contractIds } },
          },
        }
      );

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: `Permanently deleted ${contractIds.length} archived contracts`,
          data: { deletedCount: contractIds.length },
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
