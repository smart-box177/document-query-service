import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { createResponse } from "../helpers/response";
import { Application } from "../models/application.model";
import APIError from "../helpers/api.error";

export class ApplicationController {
  /**
   * Create a new application
   */
  static async createApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const applicationData = { ...req.body, userId: req.user?.id };

      const application = new Application(applicationData);
      await application.save();

      res
        .status(201)
        .json(createResponse({
          status: 201,
          success: true,
          message: "Application created successfully",
          data: application,
        }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save application as draft
   */
  static async saveAsDraft(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const applicationData = req.body;

      let application;

      if (id && Types.ObjectId.isValid(id)) {
        // Update existing application
        application = await Application.findByIdAndUpdate(
          id,
          { ...applicationData, status: "DRAFT" },
          { new: true, runValidators: false } // Disable validation for drafts
        );
        if (!application) {
          throw new APIError({
            message: "Application not found",
            status: 404,
          });
        }
      } else {
        // Create new draft application
        application = new Application({ ...applicationData, status: "DRAFT", userId: req.user?.id });
        await application.save({ validateBeforeSave: false }); // Disable validation for drafts
      }

      res
        .status(200)
        .json(createResponse({
          status: 200,
          success: true,
          message: "Application saved as draft successfully",
          data: application,
        }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save and submit application
   */
  static async saveAndSubmit(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const applicationData = req.body;

      // Validate all required fields are present when submitting
      if (!applicationData.sectionA || !applicationData.sectionB || !applicationData.sectionC) {
        throw new APIError({
          message: "All sections (A, B, C) are required to submit the application",
          status: 400,
        });
      }

      let application;

      if (id && Types.ObjectId.isValid(id)) {
        // Update and submit existing application
        application = await Application.findByIdAndUpdate(
          id,
          { ...applicationData, status: "SUBMITTED" },
          { new: true, runValidators: true } // Enable validation for submission
        );
        if (!application) {
          throw new APIError({
            message: "Application not found",
            status: 404,
          });
        }
      } else {
        // Create and submit new application
        application = new Application({ ...applicationData, status: "SUBMITTED", userId: req.user?.id });
        await application.save({ validateBeforeSave: true }); // Enable validation for submission
      }

      res
        .status(200)
        .json(createResponse({
          status: 200,
          success: true,
          message: "Application submitted successfully",
          data: application,
        }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get an application by ID
   */
  static async getApplicationById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new APIError({
          message: "Invalid application ID",
          status: 400,
        });
      }

      const application = await Application.findById(id);
      
      if (!application) {
        throw new APIError({
          message: "Application not found",
          status: 404,
        });
      }

      res
        .status(200)
        .json(createResponse({
          status: 200,
          success: true,
          message: "Application retrieved successfully",
          data: application,
        }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get applications by contract ID
   */
  static async getApplicationsByContractId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { contractId } = req.params;

      if (!Types.ObjectId.isValid(contractId)) {
        throw new APIError({
          message: "Invalid contract ID",
          status: 400,
        });
      }

      const applications = await Application.find({ 
        contractId: new Types.ObjectId(contractId) 
      }).sort({ createdAt: -1 });

      res
        .status(200)
        .json(createResponse({
          status: 200,
          success: true,
          message: "Applications retrieved successfully",
          data: applications,
        }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an application
   */
  static async updateApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!Types.ObjectId.isValid(id)) {
        throw new APIError({
          message: "Invalid application ID",
          status: 400,
        });
      }

      const application = await Application.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!application) {
        throw new APIError({
          message: "Application not found",
          status: 404,
        });
      }

      res
        .status(200)
        .json(createResponse({
          status: 200,
          success: true,
          message: "Application updated successfully",
          data: application,
        }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an application
   */
  static async deleteApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw new APIError({
          message: "Invalid application ID",
          status: 400,
        });
      }

      const application = await Application.findByIdAndDelete(id);

      if (!application) {
        throw new APIError({
          message: "Application not found",
          status: 404,
        });
      }

      res
        .status(200)
        .json(createResponse({
          status: 200,
          success: true,
          message: "Application deleted successfully",
        }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all applications with filters
   */
  static async getApplications(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { status, contractId, fromDate, toDate, search } = req.query;

      const filter: any = { userId: req.user?.id };

      if (status && typeof status === "string") {
        filter.status = { $in: status.split(",") };
      }

      if (contractId && typeof contractId === "string" && Types.ObjectId.isValid(contractId)) {
        filter.contractId = new Types.ObjectId(contractId);
      }

      if (fromDate || toDate) {
        filter.createdAt = {};
        if (fromDate && typeof fromDate === "string") {
          filter.createdAt.$gte = new Date(fromDate);
        }
        if (toDate && typeof toDate === "string") {
          const toDateObj = new Date(toDate);
          toDateObj.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = toDateObj;
        }
      }

      // Search functionality could be implemented here
      // For example, searching in referenceNumber or contractProjectTitle

      const applications = await Application.find(filter)
        .sort({ createdAt: -1 })
        .populate("contractId");

      res
        .status(200)
        .json(createResponse({
          status: 200,
          success: true,
          message: "Applications retrieved successfully",
          data: applications,
        }));
    } catch (error) {
      next(error);
    }
  }
}
