import { Router } from "express";
import { HistoryController } from "../controllers/history.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All history routes require authentication
router.use(authMiddleware);

router
  .route("/")
  .get(HistoryController.getAll)
  .post(HistoryController.create)
  .delete(HistoryController.clearAll);

router.route("/:id").delete(HistoryController.delete);

export { router as HistoryRouter };
