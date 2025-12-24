import { Router } from "express";
import { MediaController } from "../controllers/media.controller";
import { uploadMiddleware } from "../middleware/upload.middleware";

const router = Router();

router
  .route("/")
  .get(MediaController.getAll)
  .post(uploadMiddleware.single("file"), MediaController.uploadMedia);

router
  .route("/multiple")
  .post(uploadMiddleware.array("files", 10), MediaController.uploadMultipleMedia);

router.route("/zip/:contractId").get(MediaController.downloadContractZip);

router.route("/:id").get(MediaController.getById).delete(MediaController.delete);

export { router as MediaRouter };
