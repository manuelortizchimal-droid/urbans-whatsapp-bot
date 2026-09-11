import { Router } from "express";
import { prisma } from "../db/prisma";
import { logger } from "../utils/logger";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", db: "up", timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "Health check de base de datos falló");
    res.status(503).json({ status: "error", db: "down", timestamp: new Date().toISOString() });
  }
});
