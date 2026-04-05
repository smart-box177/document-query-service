import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { createResponse } from "../helpers/response";
import { Application } from "../models/application.model";
import { Media } from "../models/media.model";
import { SearchHistory } from "../models/history.model";
import { User } from "../models/user.model";
import APIError from "../helpers/api.error";
import { sendEmail } from "../services/email.service";
import { applicationSubmittedAdminTemplate } from "../helpers/emails/application-submitted";
import { CLIENT_URL } from "../constant";

export class ApplicationController {
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
      january: 1, jan: 1,
      february: 2, feb: 2,
      march: 3, mar: 3,
      april: 4, apr: 4,
      may: 5,
      june: 6, jun: 6,
      july: 7, jul: 7,
      august: 8, aug: 8,
      september: 9, sep: 9, sept: 9,
      october: 10, oct: 10,
      november: 11, nov: 11,
      december: 12, dec: 12,
    };

    let cleanQuery = query;
    let year: number | undefined;
    let month: number | undefined;

    const numericMonthMatch = query.match(/\b(\d{1,2})[\/\-](20\d{2})\b/);
    if (numericMonthMatch) {
      const parsedMonth = parseInt(numericMonthMatch[1], 10);
      if (parsedMonth >= 1 && parsedMonth <= 12) {
        month = parsedMonth;
        year = parseInt(numericMonthMatch[2], 10);
        cleanQuery = cleanQuery.replace(numericMonthMatch[0], "").trim();
      }
    }

    if (!year) {
      const yearMatch = cleanQuery.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
        cleanQuery = cleanQuery.replace(yearMatch[0], "").trim();
      }
    }

    const monthPattern = new RegExp(
      `\\b(${Object.keys(monthNames).join("|")})\\b`,
      "i"
    );
    const monthMatch = cleanQuery.match(monthPattern);
    if (monthMatch) {
      month = monthNames[monthMatch[1].toLowerCase()];
      cleanQuery = cleanQuery.replace(monthMatch[0], "").trim();
    }

    cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();
    return { cleanQuery, year, month };
  }

  // ==================== APPLICATION CRUD ====================

  static async createApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const applicationData = { ...req.body, userId: req.user?.id };
      const application = new Application(applicationData);
      await application.save();

      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "Application created successfully",
          data: application,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async saveAsDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const applicationData = req.body;
      let application;

      if (id && Types.ObjectId.isValid(id)) {
        application = await Application.findByIdAndUpdate(
          id,
          { ...applicationData, status: "DRAFT" },
          { new: true, runValidators: false }
        );
        if (!application) {
          throw new APIError({ message: "Application not found", status: 404 });
        }
      } else {
        application = new Application({
          ...applicationData,
          status: "DRAFT",
          userId: req.user?.id,
        });
        await application.save({ validateBeforeSave: false });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Application saved as draft successfully",
          data: application,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async saveAndSubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const applicationData = req.body;

      if (
        !applicationData.sectionA ||
        !applicationData.sectionB ||
        !applicationData.sectionC
      ) {
        throw new APIError({
          message:
            "All sections (A, B, C) are required to submit the application",
          status: 400,
        });
      }

      let application;

      if (id && Types.ObjectId.isValid(id)) {
        application = await Application.findByIdAndUpdate(
          id,
          { ...applicationData, status: "SUBMITTED" },
          { new: true, runValidators: true }
        );
        if (!application) {
          throw new APIError({ message: "Application not found", status: 404 });
        }
      } else {
        application = new Application({
          ...applicationData,
          status: "SUBMITTED",
          userId: req.user?.id,
        });
        await application.save({ validateBeforeSave: true });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Application submitted successfully",
          data: application,
        })
      );

      // Fire-and-forget: notify all admins by email (does not block the response)
      void (async () => {
        try {
          const admins = await User.find({ role: "PCAD" }).select("email firstname lastname username").lean();
          if (!admins.length) return;

          const appId = String(application._id);
          const contractTitle =
            (application as any).sectionA?.contractProjectTitle ??
            (application as any).contractTitle ??
            "";
          const operator =
            (application as any).sectionA?.operatorOrProjectPromoter ??
            (application as any).operator ??
            "";
          const referenceNumber =
            (application as any).sectionA?.referenceNumber ?? "";
          const applicantName = req.user?.username ?? req.user?.email ?? "An operator";
          const reviewLink = `${CLIENT_URL}/admin/applications`;

          await Promise.allSettled(
            admins.map((admin) =>
              sendEmail({
                to: admin.email as string,
                subject: `[Action Required] New NCCC Application Submitted — ${referenceNumber || appId.slice(-8).toUpperCase()}`,
                html: applicationSubmittedAdminTemplate(
                  admin.firstname ?? admin.username,
                  applicantName,
                  appId,
                  contractTitle,
                  operator,
                  referenceNumber,
                  reviewLink
                ),
              })
            )
          );
        } catch {
          // Swallow — email failure must never break the submission response
        }
      })();
    } catch (error) {
      next(error);
    }
  }

  static async getApplicationById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new APIError({ message: "Invalid application ID", status: 400 });
      }

      const application = await Application.findById(id);
      if (!application) {
        throw new APIError({ message: "Application not found", status: 404 });
      }

      const media = await Media.find({
        applicationId: id,
        isDeleted: false,
      }).select("url filename originalName mimetype size");

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Application retrieved successfully",
          data: { ...application.toObject(), media },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new APIError({ message: "Invalid application ID", status: 400 });
      }

      const application = await Application.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!application) {
        throw new APIError({ message: "Application not found", status: 404 });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Application updated successfully",
          data: application,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new APIError({ message: "Invalid application ID", status: 400 });
      }

      const application = await Application.findByIdAndDelete(id);
      if (!application) {
        throw new APIError({ message: "Application not found", status: 404 });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Application deleted successfully",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getApplications(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        operator,
        year,
        contractorName,
        hasMedia,
        fromDate,
        toDate,
      } = req.query;

      const filter: Record<string, unknown> = { userId: req.user?.id };

      if (status && typeof status === "string") {
        filter.status = { $in: status.split(",") };
      }
      if (operator) filter.operator = operator;
      if (year) filter.year = Number(year);
      if (contractorName)
        filter.contractorName = { $regex: contractorName, $options: "i" };
      if (hasMedia !== undefined) filter.hasMedia = hasMedia === "true";

      if (fromDate || toDate) {
        const dateRange: Record<string, Date> = {};
        if (fromDate && typeof fromDate === "string")
          dateRange.$gte = new Date(fromDate);
        if (toDate && typeof toDate === "string") {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          dateRange.$lte = end;
        }
        filter.createdAt = dateRange;
      }

      const applications = await Application.find(filter)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Application.countDocuments(filter);

      const applicationIds = applications.map((a) => a._id);
      const media = await Media.find({
        applicationId: { $in: applicationIds },
        isDeleted: false,
      }).select("url filename originalName mimetype size applicationId");

      const applicationsWithMedia = applications.map((application) => ({
        ...application.toObject(),
        media: media.filter(
          (m) => m.applicationId?.toString() === application._id.toString()
        ),
      }));

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Applications retrieved successfully",
          data: {
            applications: applicationsWithMedia,
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

  static async getApplicationsAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { status, operator, page = 1, limit = 10 } = req.query;
      const query: Record<string, unknown> = {};

      if (status) query.status = status;
      if (operator)
        query.operator = { $regex: operator, $options: "i" };

      if (req.user?.role !== "admin" && req.user?.role !== "PCAD") {
        query.userId = new Types.ObjectId(req.user?.id);
      }

      const applications = await Application.find(query)
        .populate("userId", "username email")
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Application.countDocuments(query);

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Applications retrieved successfully",
          data: {
            applications,
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

  static async reviewApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { status, adminComments } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        throw new APIError({ message: "Invalid application ID", status: 400 });
      }

      if (!["APPROVED", "REJECTED", "REVISION_REQUESTED"].includes(status)) {
        throw new APIError({ message: "Invalid status update", status: 400 });
      }

      const application = await Application.findByIdAndUpdate(
        id,
        { status, adminComments },
        { new: true, runValidators: true }
      ).populate("userId", "username email");

      if (!application) {
        throw new APIError({ message: "Application not found", status: 404 });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: `Application ${status.toLowerCase().replace("_", " ")} successfully`,
          data: application,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== SEARCH ====================

  public static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, tab = "all" } = req.query;

      if (!q) {
        throw new APIError({ message: "Search query is required", status: 400 });
      }

      const originalQuery = String(q);
      const { cleanQuery, year, month } =
        ApplicationController.parseDateFromQuery(originalQuery);

      let userArchivedIds: string[] = [];
      if (req.user?.id) {
        const user = await User.findById(req.user.id).select("archivedApplications");
        userArchivedIds = (user?.archivedApplications || []).map((a) =>
          a.applicationId.toString()
        );
      }

      const dateFilter: Record<string, unknown> = {};
      if (year) {
        const searchMonth = month ? month - 1 : 0;
        let rangeStart: Date;
        let rangeEnd: Date;

        if (month) {
          rangeStart = new Date(year, searchMonth, 1);
          rangeEnd = new Date(year, searchMonth + 1, 0, 23, 59, 59, 999);
        } else {
          rangeStart = new Date(year, 0, 1);
          rangeEnd = new Date(year, 11, 31, 23, 59, 59, 999);
        }

        dateFilter.$and = [
          { startDate: { $lte: rangeEnd } },
          { endDate: { $gte: rangeStart } },
        ];
      }

      const textSearchConditions = cleanQuery
        ? {
            $or: [
              { contractTitle: { $regex: cleanQuery, $options: "i" } },
              { contractorName: { $regex: cleanQuery, $options: "i" } },
              { operator: { $regex: cleanQuery, $options: "i" } },
              { contractNumber: { $regex: cleanQuery, $options: "i" } },
              { "sectionA.contractProjectTitle": { $regex: cleanQuery, $options: "i" } },
              { "sectionA.mainContractor": { $regex: cleanQuery, $options: "i" } },
              { "sectionA.operatorOrProjectPromoter": { $regex: cleanQuery, $options: "i" } },
            ],
          }
        : {};

      const applications = await Application.find({
        isArchived: false,
        ...(userArchivedIds.length > 0 && { _id: { $nin: userArchivedIds } }),
        ...dateFilter,
        ...textSearchConditions,
      }).limit(20);

      const applicationIds = applications.map((a) => a._id);
      const media = await Media.find({
        applicationId: { $in: applicationIds },
        isDeleted: false,
      }).select("url filename originalName mimetype size applicationId");

      const applicationsWithMedia = applications.map((application) => ({
        ...application.toObject(),
        media: media.filter(
          (m) => m.applicationId?.toString() === application._id.toString()
        ),
      }));

      if (req.user?.id) {
        await SearchHistory.create({
          userId: req.user.id,
          query: originalQuery,
          resultsCount: applications.length,
          tab: String(tab),
        }).catch(() => {});
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Search results retrieved successfully",
          data: applicationsWithMedia,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== SEARCH HISTORY ====================

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
          data: { history, total, page: Number(page), limit: Number(limit) },
        })
      );
    } catch (error) {
      next(error);
    }
  }

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
        createResponse({ status: 200, success: true, message: "History entry deleted" })
      );
    } catch (error) {
      next(error);
    }
  }

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

  // ==================== BOOKMARKS ====================

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
      const applicationIds = bookmarks.map((b) => b.applicationId);

      const applications = await Application.find({ _id: { $in: applicationIds } });

      const bookmarksWithDetails = bookmarks
        .map((bookmark) => {
          const application = applications.find(
            (a) => a._id.toString() === bookmark.applicationId.toString()
          );
          if (!application) return null;
          return {
            id: application._id,
            contractTitle:
              application.contractTitle ||
              application.sectionA?.contractProjectTitle,
            operator:
              application.operator ||
              application.sectionA?.operatorOrProjectPromoter,
            contractorName:
              application.contractorName || application.sectionA?.mainContractor,
            contractNumber:
              application.contractNumber ||
              application.sectionA?.contractProjectNumber,
            year: application.year,
            contractValue:
              application.contractValue ||
              application.sectionA?.totalContractValue,
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

      const { applicationId } = req.params;

      const application = await Application.findById(applicationId);
      if (!application) {
        throw new APIError({ message: "Application not found", status: 404 });
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      const existingBookmark = user.bookmarks?.find(
        (b) => b.applicationId.toString() === applicationId
      );

      if (existingBookmark) {
        throw new APIError({
          message: "Application already bookmarked",
          status: 400,
        });
      }

      await User.findByIdAndUpdate(userId, {
        $push: { bookmarks: { applicationId, bookmarkedAt: new Date() } },
      });

      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "Application bookmarked",
          data: {
            applicationId,
            contractTitle:
              application.contractTitle ||
              application.sectionA?.contractProjectTitle,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

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

      const { applicationId } = req.params;

      const result = await User.findByIdAndUpdate(userId, {
        $pull: { bookmarks: { applicationId } },
      });

      if (!result) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      res.status(200).json(
        createResponse({ status: 200, success: true, message: "Bookmark removed" })
      );
    } catch (error) {
      next(error);
    }
  }

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

      await User.findByIdAndUpdate(userId, { $set: { bookmarks: [] } });

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

  // ==================== USER ARCHIVE ====================

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

      const user = await User.findById(userId).select("archivedApplications");
      if (!user) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      const archivedEntries = user.archivedApplications || [];
      const applicationIds = archivedEntries.map((a) => a.applicationId);

      const applications = await Application.find({ _id: { $in: applicationIds } });

      const archiveWithDetails = archivedEntries
        .map((archived) => {
          const application = applications.find(
            (a) => a._id.toString() === archived.applicationId.toString()
          );
          if (!application) return null;
          return {
            id: application._id,
            contractTitle:
              application.contractTitle ||
              application.sectionA?.contractProjectTitle,
            operator:
              application.operator ||
              application.sectionA?.operatorOrProjectPromoter,
            contractorName:
              application.contractorName || application.sectionA?.mainContractor,
            contractNumber:
              application.contractNumber ||
              application.sectionA?.contractProjectNumber,
            year: application.year,
            contractValue:
              application.contractValue ||
              application.sectionA?.totalContractValue,
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

      const { applicationId } = req.params;

      const application = await Application.findById(applicationId);
      if (!application) {
        throw new APIError({ message: "Application not found", status: 404 });
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      const existingArchive = user.archivedApplications?.find(
        (a) => a.applicationId.toString() === applicationId
      );

      if (existingArchive) {
        throw new APIError({
          message: "Application already archived",
          status: 400,
        });
      }

      await User.findByIdAndUpdate(userId, {
        $push: { archivedApplications: { applicationId, archivedAt: new Date() } },
      });

      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "Application archived",
          data: {
            applicationId,
            contractTitle:
              application.contractTitle ||
              application.sectionA?.contractProjectTitle,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

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

      const { applicationId } = req.params;

      const result = await User.findByIdAndUpdate(userId, {
        $pull: { archivedApplications: { applicationId } },
      });

      if (!result) {
        throw new APIError({ message: "User not found", status: 404 });
      }

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Application restored from archive",
        })
      );
    } catch (error) {
      next(error);
    }
  }

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
        $set: { archivedApplications: [] },
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

  // ==================== ADMIN ARCHIVE ====================

  public static async getGlobalArchive(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { page = 1, limit = 50 } = req.query;

      const applications = await Application.find({ isArchived: true })
        .populate("archivedBy", "username firstname lastname")
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ archivedAt: -1 });

      const total = await Application.countDocuments({ isArchived: true });

      const archiveData = applications.map((application) => ({
        id: application._id,
        contractTitle:
          application.contractTitle ||
          application.sectionA?.contractProjectTitle,
        operator:
          application.operator ||
          application.sectionA?.operatorOrProjectPromoter,
        contractorName:
          application.contractorName || application.sectionA?.mainContractor,
        contractNumber:
          application.contractNumber ||
          application.sectionA?.contractProjectNumber,
        year: application.year,
        contractValue:
          application.contractValue || application.sectionA?.totalContractValue,
        archivedAt: application.archivedAt,
        archivedBy: application.archivedBy,
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

      const { applicationId } = req.params;

      const application = await Application.findById(applicationId);
      if (!application) {
        throw new APIError({ message: "Application not found", status: 404 });
      }

      if (application.isArchived) {
        throw new APIError({
          message: "Application is already archived",
          status: 400,
        });
      }

      application.isArchived = true;
      application.archivedAt = new Date();
      application.archivedBy = new Types.ObjectId(userId);
      await application.save();

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Application archived globally",
          data: {
            applicationId,
            contractTitle:
              application.contractTitle ||
              application.sectionA?.contractProjectTitle,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async restoreGlobally(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { applicationId } = req.params;

      const application = await Application.findById(applicationId);
      if (!application) {
        throw new APIError({ message: "Application not found", status: 404 });
      }

      if (!application.isArchived) {
        throw new APIError({
          message: "Application is not archived",
          status: 400,
        });
      }

      application.isArchived = false;
      application.archivedAt = undefined;
      application.archivedBy = undefined;
      await application.save();

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Application restored from global archive",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async permanentlyDelete(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { applicationId } = req.params;

      const application = await Application.findById(applicationId);
      if (!application) {
        throw new APIError({ message: "Application not found", status: 404 });
      }

      if (!application.isArchived) {
        throw new APIError({
          message: "Application must be archived before permanent deletion",
          status: 400,
        });
      }

      await Application.findByIdAndDelete(applicationId);

      await User.updateMany(
        {},
        {
          $pull: {
            bookmarks: { applicationId },
            archivedApplications: { applicationId },
          },
        }
      );

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Application permanently deleted",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async emptyGlobalArchive(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const archivedApplications = await Application.find({
        isArchived: true,
      }).select("_id");
      const applicationIds = archivedApplications.map((a) => a._id);

      await Application.deleteMany({ isArchived: true });

      await User.updateMany(
        {},
        {
          $pull: {
            bookmarks: { applicationId: { $in: applicationIds } },
            archivedApplications: { applicationId: { $in: applicationIds } },
          },
        }
      );

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: `Permanently deleted ${applicationIds.length} archived applications`,
          data: { deletedCount: applicationIds.length },
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
