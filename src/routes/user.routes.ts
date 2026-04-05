import { Router } from "express";
import { MediaController } from "../controllers/media.controller";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { authenticateUser } from "../middleware/auth.middleware";
import { UserController } from "../controllers/user.controller";

const router = Router();

router.use(authenticateUser);

router.route("/profile").put(UserController.updateProfile);

router.route("/signature/remove-bg").post(UserController.removeSignatureBackground);

router.route("/signature").post(uploadMiddleware.single("file"), MediaController.uploadSignature);

router.route("/sign-declaration").post(UserController.signDeclaration);

export { router as UserRouter };