import { Router, Request, Response, NextFunction } from "express";
import { verifyWebhook, receiveWebhook } from "../controllers/webhook.controller";
import { isValidWebhookSignature } from "../whatsapp/signature";
import { InvalidSignatureError } from "../utils/errors";
import { logger } from "../utils/logger";
export const webhookRouter = Router();
webhookRouter.get("/webhook", verifyWebhook);
function validateSignature(req:Request,_res:Response,next:NextFunction):void{const signature=req.header("x-hub-signature-256"); if(!req.rawBody||!isValidWebhookSignature(req.rawBody,signature)){logger.warn({ip:req.ip},"Webhook POST rechazado: firma invalida"); next(new InvalidSignatureError()); return;} next();}
webhookRouter.post("/webhook", validateSignature, receiveWebhook);
