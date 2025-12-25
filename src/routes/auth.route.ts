import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

router.route("/google-signin").get(AuthController.initOAuth);

router.route("/google-signin/callback").get(AuthController.callback);

router.route("/signup").post(AuthController.signup);

router.route("/signin").post(AuthController.signin);

router.route("/verify").post(AuthController.verifyAccount);

router.use(authenticateUser);

router.route("/me").get(AuthController.me);

export { router as AuthRouter };
