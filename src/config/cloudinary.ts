import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../constant";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

enum CloudinaryResourceType {
  IMAGE = "image",
  VIDEO = "video",
  RAW = "raw",
  AUTO = "auto",
}

const IMAGE_FORMATS = ["jpg", "jpeg", "png", "gif"];
const DOCUMENT_FORMATS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
];
const ALLOWED_FORMATS = [...IMAGE_FORMATS, ...DOCUMENT_FORMATS];

const getResourceType = (format: string): CloudinaryResourceType => {
  if (IMAGE_FORMATS.includes(format.toLowerCase())) {
    return CloudinaryResourceType.IMAGE;
  }
  if (DOCUMENT_FORMATS.includes(format.toLowerCase())) {
    return CloudinaryResourceType.RAW;
  }
  return CloudinaryResourceType.AUTO;
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req, file) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase() || "";
    return {
      folder: "doc_query/media",
      allowed_formats: ALLOWED_FORMATS,
      // resource_type: getResourceType(ext),
      resource_type: "auto",
      transformation: IMAGE_FORMATS.includes(ext)
        ? [{ quality: "auto" }]
        : undefined,
    };
  },
});

export { storage, ALLOWED_FORMATS, CloudinaryResourceType, getResourceType };
