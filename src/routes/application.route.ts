import express from "express";
import { ApplicationController } from "../controllers/application.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = express.Router();

router.use(authenticateUser);

// Search history (must be before /:id)
router.get("/search/history", ApplicationController.getSearchHistory);
router.delete("/search/history", ApplicationController.clearSearchHistory);
router.delete(
  "/search/history/:historyId",
  ApplicationController.deleteSearchHistory,
);

// Bookmarks (must be before /:id)
router.get("/bookmarks", ApplicationController.getBookmarks);
router.delete("/bookmarks", ApplicationController.clearBookmarks);
router.post("/bookmarks/:applicationId", ApplicationController.addBookmark);
router.delete(
  "/bookmarks/:applicationId",
  ApplicationController.removeBookmark,
);

// User archive (must be before /:id)
router.get("/archive/user", ApplicationController.getUserArchive);
router.delete("/archive/user", ApplicationController.clearUserArchive);
router.post(
  "/archive/user/:applicationId",
  ApplicationController.archiveForUser,
);
router.delete(
  "/archive/user/:applicationId",
  ApplicationController.restoreForUser,
);

// Global archive (admin only, must be before /:id)
router.get(
  "/archive/global",
  requireAdmin,
  ApplicationController.getGlobalArchive,
);
router.delete(
  "/archive/global",
  requireAdmin,
  ApplicationController.emptyGlobalArchive,
);
router.post(
  "/archive/global/:applicationId",
  requireAdmin,
  ApplicationController.archiveGlobally,
);
router.delete(
  "/archive/global/:applicationId",
  requireAdmin,
  ApplicationController.restoreGlobally,
);
router.delete(
  "/archive/global/:applicationId/permanent",
  requireAdmin,
  ApplicationController.permanentlyDelete,
);

// Application CRUD
router.post("/", ApplicationController.createApplication);
router.post("/draft", ApplicationController.saveAsDraft);
router.post("/submit", ApplicationController.saveAndSubmit);
router.get("/", ApplicationController.getApplications);
router.get("/analytics", ApplicationController.getAnalytics);
router.get("/search", ApplicationController.search);
router.put("/:id/draft", ApplicationController.saveAsDraft);
router.put("/:id/submit", ApplicationController.saveAndSubmit);
router.put(
  "/:id/review",
  requireAdmin,
  ApplicationController.reviewApplication,
);
router.post("/:id/export", ApplicationController.exportToExcel);
router.put("/:id", ApplicationController.updateApplication);
router.delete("/:id", ApplicationController.deleteApplication);
router.get("/:id", ApplicationController.getApplicationById);

export default router;
