import express, { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireStaff } from "./auth";
import { AppError } from "./errors";
import { QueueService } from "./service";

const join = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(3).max(30),
});

const complete = z.object({
  status: z.enum(["Served", "NoShow"]),
});

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export function createApp(service: QueueService) {
  const app = express();

  app.use(express.json());

  // Health check is public and does not require authentication.
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // All API routes below this point require authentication.
  app.use(authenticate);

  app.post(
    "/queues/:queueId/join",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = join.parse(req.body);
        const key = req.header("Idempotency-Key");

        if (!key) {
          return res.status(400).json({
            error: "VALIDATION_ERROR",
            message: "Idempotency-Key is required",
          });
        }

        const queueId = param(req.params.queueId);
        const result = await service.join(req.auth!.tenantId, queueId, {
          ...body,
          idempotencyKey: key,
        });

        return res.status(201).json(result);
      } catch (error) {
        return next(error);
      }
    }
  );

  app.get(
    "/queues/:queueId/entries/:entryId",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const queueId = param(req.params.queueId);
        const entryId = param(req.params.entryId);
        const result = await service.status(req.auth!.tenantId, queueId, entryId);
        return res.json(result);
      } catch (error) {
        return next(error);
      }
    }
  );

  app.get(
    "/queues/:queueId/waiting",
    requireStaff,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const queueId = param(req.params.queueId);
        const result = await service.waiting(req.auth!.tenantId, queueId);
        return res.json(result);
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    "/queues/:queueId/call-next",
    requireStaff,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const queueId = param(req.params.queueId);
        const result = await service.callNext(req.auth!.tenantId, queueId);
        if (!result) return res.status(404).json({ error: "QUEUE_EMPTY" });
        return res.json(result);
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    "/queues/:queueId/entries/:entryId/complete",
    requireStaff,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = complete.parse(req.body);
        const queueId = param(req.params.queueId);
        const entryId = param(req.params.entryId);
        const result = await service.complete(
          req.auth!.tenantId,
          queueId,
          entryId,
          body.status
        );
        return res.json(result);
      } catch (error) {
        return next(error);
      }
    }
  );

  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: error.issues.map((issue) => issue.message).join(", "),
        });
      }
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.code,
          message: error.message,
        });
      }
      console.error(error);
      return res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  );

  return app;
}
