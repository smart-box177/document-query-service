import { Request, Response, NextFunction } from "express";
import { Application } from "../models/application.model";
import { createResponse } from "../helpers/response";

/**
 * Returns compliance stats per operator for a given year (or all years)
 * GET /applications/compliance-reports?year=2025
 */
export class ComplianceController {
  static async getOperatorComplianceReports(req: Request, res: Response, next: NextFunction) {
    try {
      const { year } = req.query;
      const match: any = {};
      if (year) {
        match.year = Number(year);
      }

      // Group by operator, count statuses
      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: "$operator",
            submitted: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "REVIEWING"] }, 1, 0] } },
            revisionRequested: { $sum: { $cond: [{ $eq: ["$status", "REVISION_REQUESTED"] }, 1, 0] } },
          },
        },
        {
          $addFields: {
            complianceRate: {
              $cond: [
                { $eq: ["$submitted", 0] },
                0,
                { $round: [{ $multiply: [{ $divide: ["$approved", "$submitted"] }, 100] }, 0] },
              ],
            },
            status: {
              $switch: {
                branches: [
                  { case: { $gte: ["$complianceRate", 80] }, then: "compliant" },
                  { case: { $gte: ["$complianceRate", 60] }, then: "partial" },
                  { case: { $eq: ["$submitted", 0] }, then: "pending" },
                ],
                default: "non-compliant",
              },
            },
          },
        },
        {
          $project: {
            operator: "$_id",
            submitted: 1,
            approved: 1,
            rejected: 1,
            pending: 1,
            revisionRequested: 1,
            complianceRate: 1,
            status: 1,
            _id: 0,
          },
        },
        { $sort: { complianceRate: -1 } },
      ];

      const reports = await Application.aggregate(pipeline);
      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Operator compliance reports",
          data: reports,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
