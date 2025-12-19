import { Request, Response, Router } from "express";
import { createResponse } from "../helpers/response";

const router = Router();

router.get("/health-check", (_req: Request, res: Response) => {
  res.status(200).json(
    createResponse({
      status: 200,
      success: true,
      message: "Chapta Service is up and running...",
    })
  );
});

export default router;
