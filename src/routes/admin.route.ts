import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { requireAdmin, requirePCAD } from "../middleware/admin.middleware";
import { ApplicationController } from "../controllers/application.controller";
import APIError from "../helpers/api.error";

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// ── Routes accessible by admin OR PCAD ────────────────────────────────────────
const requireAdminOrPCAD = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role === "admin" || req.user?.role === "PCAD") return next();
  return next(new APIError({ message: "Access denied", status: 403 }));
};

// GET /admin/applications — view queue (admin + PCAD)
router.get("/applications", requireAdminOrPCAD, ApplicationController.getApplicationsAdmin);

// PATCH /admin/:id/review — approve / reject / revise (PCAD only)
router.patch("/:id/review", requirePCAD, ApplicationController.reviewApplication);

// ── Routes accessible by admin only ───────────────────────────────────────────
router.use(requireAdmin);

// GET  /admin            — get all users
router.get("/", UserController.getAllUsers);

// GET  /admin/stats      — user statistics
router.get("/stats", UserController.getUserStats);

// GET  /admin/:id        — get user by ID
router.get("/:id", UserController.getUserById);

// PATCH /admin/:id/role  — update user role
router.patch("/:id/role", UserController.updateUserRole);

// DELETE /admin/:id      — delete user
router.delete("/:id", UserController.deleteUser);

export { router as AdminRouter };
