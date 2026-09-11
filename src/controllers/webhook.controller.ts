import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { enqueueInboundMessages } from "../services/inboundQueue.service";
import { WhatsAppWebhookBody } from "../types/whatsapp.types";

function safeTokenEqual(provided: unknown, expected: string): boolean {
  if (typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyWebhook(req: Request, res: Response): void {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && safeTokenEqual(token, env.WHATSAPP_VERIFY_TOKEN) && typeof challenge === "string") {
    logger.info("Webhook verificado correctamente por Meta");
    res.status(200).send(challenge);
    return;
  }

  logger.warn({ mode, tokenProvided: typeof token === "string" }, "Intento de verificacion de webhook con token invalido");
  res.sendStatus(403);
}

export async function receiveWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as WhatsAppWebhookBody;
    if (body?.object !== "whatsapp_business_account" || !Array.isArray(body.entry)) {
      res.sendStatus(200);
      return;
    }

    for (const entry of body.entry) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const contactName = value.contacts?.[0]?.profile?.name;
        await enqueueInboundMessages(value.messages ?? [], contactName);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "No se pudo persistir el webhook entrante; Meta debe reintentar");
    next(err);
  }
}
