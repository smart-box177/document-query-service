import multer from "multer";
import { ALLOWED_FORMATS, storage } from "../config/cloudinary";

const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_FORMATS.includes(fileExtension)) {
      return cb(
        new Error(
          `File type not allowed. Allowed types: ${ALLOWED_FORMATS.join(", ")}`
        )
      );
    }
    cb(null, true);
  },
});

export { uploadMiddleware };
