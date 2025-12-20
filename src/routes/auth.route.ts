import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.route("/google-signin").get(AuthController.initOAuth);

router.route("/google-signin/callback").get(AuthController.callback);

export { router as AuthRouter };
