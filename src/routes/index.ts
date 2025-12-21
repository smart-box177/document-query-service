import { AuthRouter } from "./auth.route";
import { ContractRouter } from "./contract.route";
import { MediaRouter } from "./media.route";
import { Request, Response, Router } from "express";
import { createResponse } from "../helpers/response";

const router = Router();

router.get("/health-check", (_req: Request, res: Response) => {
  res.status(200).json(
    createResponse({
      status: 200,
      success: true,
      message: "contract doc query service is up and running...",
    })
  );
});

router.use("/auth", AuthRouter);

router.use("/contracts", ContractRouter);

router.use("/media", MediaRouter);

export { router as rootRouter };
