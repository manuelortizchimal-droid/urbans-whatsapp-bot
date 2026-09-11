import { Router } from "express";
import { prisma } from "../db/prisma";
export const healthRouter = Router();
healthRouter.get("/health", async (_req,res)=>{try{await prisma.$queryRaw`SELECT 1`;res.status(200).json({status:"ok",db:"up",timestamp:new Date().toISOString()});}catch(err){res.status(503).json({status:"error",db:"down",error:(err as Error).message});}});
