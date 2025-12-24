import { NextFunction, Request, Response } from "express";
import { createResponse } from "../helpers/response";
import APIError from "../helpers/api.error";
import HttpStatus from "http-status";
import { Media } from "../models/media.model";
import { v2 as cloudinary } from "cloudinary";
import { Contract } from "../models/contract.model";
import axios from "axios";
import archiver from "archiver";

interface CloudinaryFile extends Express.Multer.File {
  path: string;
  filename: string;
}

const getFileExtension = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? `.${ext}` : "";
};

const appendExtensionToUrl = (url: string, originalName: string): string => {
  const ext = getFileExtension(originalName);
  if (ext && url.includes("/raw/upload/") && !url.endsWith(ext)) {
    return `${url}${ext}`;
  }
  return url;
};

export class MediaController {
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

      const file = req.file as CloudinaryFile;
      const { uploadedBy, contractId, tags } = req.body;
      console.log("file path " + file.path);
      // const url = appendExtensionToUrl(file.path, file.originalname);

      const media = await Media.create({
        url: file.path,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        publicId: file.filename,
        uploadedBy,
        contractId,
        tags: tags ? JSON.parse(tags) : [],
      });

      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "File uploaded successfully",
          data: media,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async uploadMultipleMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new APIError({
          message: "No files uploaded",
          status: HttpStatus.BAD_REQUEST,
        });
      }

      const files = req.files as CloudinaryFile[];
      const { uploadedBy, contractId, tags } = req.body;
      const parsedTags = tags ? JSON.parse(tags) : [];

      const mediaData = files.map((file) => ({
        url: appendExtensionToUrl(file.path, file.originalname),
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        publicId: file.filename,
        uploadedBy,
        contractId,
        tags: parsedTags,
      }));

      const uploadedMedia = await Media.insertMany(mediaData);

      res.status(201).json(
        createResponse({
          status: 201,
          success: true,
          message: "Files uploaded successfully",
          data: uploadedMedia,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, contractId, uploadedBy, tags } = req.query;
      const query: Record<string, unknown> = { isDeleted: false };

      if (contractId) query.contractId = contractId;
      if (uploadedBy) query.uploadedBy = uploadedBy;
      if (tags) query.tags = { $in: String(tags).split(",") };

      const media = await Media.find(query)
        .populate("uploadedBy", "username email")
        .populate("contractId", "contractTitle contractNumber")
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Media.countDocuments(query);

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Media retrieved successfully",
          data: { media, total, page: Number(page), limit: Number(limit) },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const media = await Media.findOne({ _id: id, isDeleted: false })
        .populate("uploadedBy", "username email")
        .populate("contractId", "contractTitle contractNumber")
        .orFail(() => {
          throw new APIError({ message: "Media not found", status: 404 });
        });

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Media retrieved successfully",
          data: media,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const media = await Media.findOne({ _id: id, isDeleted: false }).orFail(
        () => {
          throw new APIError({ message: "Media not found", status: 404 });
        }
      );

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(media.publicId);

      // Soft delete in database
      media.isDeleted = true;
      media.deletedAt = new Date();
      await media.save();

      res.status(200).json(
        createResponse({
          status: 200,
          success: true,
          message: "Media deleted successfully",
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async downloadContractZip(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { contractId } = req.params;

      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new APIError({
          message: "Contract not found",
          status: HttpStatus.NOT_FOUND,
        });
      }

      const mediaFiles = await Media.find({
        contractId,
        isDeleted: false,
      });

      if (mediaFiles.length === 0) {
        throw new APIError({
          message: "No files found for this contract",
          status: HttpStatus.NOT_FOUND,
        });
      }

      // Generate safe filename from contract title
      const safeTitle = (contract.contractTitle || "contract")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 50);
      const zipFilename = `${safeTitle}_documents.zip`;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${zipFilename}"`
      );

      const archive = archiver("zip", { zlib: { level: 5 } });

      archive.on("error", (err) => {
        throw new APIError({
          message: `Archive error: ${err.message}`,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      });

      archive.pipe(res);

      // Download and add each file to the archive
      for (const file of mediaFiles) {
        try {
          const response = await axios.get(file.url, {
            responseType: "stream",
          });
          const filename = file.originalName || file.filename;
          archive.append(response.data, { name: filename });
        } catch (err) {
          console.error(`Failed to fetch file ${file.url}:`, err);
          // Continue with other files even if one fails
        }
      }

      await archive.finalize();
    } catch (error) {
      next(error);
    }
  }
}
