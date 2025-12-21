import { NextFunction, Request, Response } from "express";
import { createResponse } from "../helpers/response";
import { Contract } from "../models/contract.model";
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

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contracts retrieved successfully",
          data: { contracts, total, page: Number(page), limit: Number(limit) },
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

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Contract retrieved successfully",
          data: contract,
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
      const { q } = req.query;

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

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Search results retrieved successfully",
          data: contracts,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}
