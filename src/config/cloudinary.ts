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

const ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "f3d-suite/media",
    allowed_formats: ALLOWED_FORMATS,
    resource_type: "auto",
    transformation: [{ quality: "auto" }],
  } as any,
});

export { storage, ALLOWED_FORMATS };
