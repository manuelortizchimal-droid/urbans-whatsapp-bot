import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { logger } from "../utils/logger";
import { findOrCreateLead } from "./lead.service";
import { processInboundMessage } from "./flow.service";
import { WhatsAppMessage } from "../types/whatsapp.types";
import { NormalizedInboundMessage } from "../types/flow.types";

const MAX_ATTEMPTS = 8;
const BATCH_SIZE = 50;

function normalizeMessage(msg: WhatsAppMessage): NormalizedInboundMessage {
  let interactiveId: string | null = null;
  let interactiveTitle: string | null = null;

  if (msg.type === "interactive" && msg.interactive) {
    if (msg.interactive.type === "button_reply" && msg.interactive.button_reply) {
      interactiveId = msg.interactive.button_reply.id;
      interactiveTitle = msg.interactive.button_reply.title;
    } else if (msg.interactive.type === "list_reply" && msg.interactive.list_reply) {
      interactiveId = msg.interactive.list_reply.id;
      interactiveTitle = msg.interactive.list_reply.title;
    }
  }

  if (msg.type === "button" && (msg as any).button) {
    interactiveId = (msg as any).button.payload ?? null;
    interactiveTitle = (msg as any).button.text ?? null;
  }

  const rawText = msg.type === "text" ? msg.text?.body?.trim() ?? null : null;

  return {
    waId: msg.from,
    rawText,
    interactiveId,
    interactiveTitle,
    referral: msg.referral ? {
      sourceUrl: msg.referral.source_url,
      sourceType: msg.referral.source_type,
      sourceId: msg.referral.source_id,
      headline: msg.referral.headline
    } : undefined
  };
}

export async function enqueueInboundMessages(messages: WhatsAppMessage[], contactName?: string): Promise<void> {
  if (messages.length === 0) return;
  await prisma.inboundMessageJob.createMany({
    data: messages.map(msg => ({
      waMessageId: msg.id,
      message: msg as unknown as Prisma.InputJsonValue,
      contactName
    })),
    skipDuplicates: true
  });
}

function nextRetryDate(attempts: number): Date {
  const seconds = Math.min(15 * 2 ** Math.max(0, attempts - 1), 15 * 60);
  return new Date(Date.now() + seconds * 1000);
}

async function processJob(job: { id: string; waMessageId: string; message: Prisma.JsonValue; contactName: string | null; attempts: number }): Promise<void> {
  const alreadyProcessed = await prisma.processedMessage.findUnique({ where: { waMessageId: job.waMessageId }, select: { id: true } });
  if (alreadyProcessed) {
    await prisma.inboundMessageJob.delete({ where: { id: job.id } });
    return;
  }

  const msg = job.message as unknown as WhatsAppMessage;
  const input = normalizeMessage(msg);
  const lead = await findOrCreateLead(msg.from, msg.from, job.contactName ?? undefined, input);
  await processInboundMessage(lead, input);

  await prisma.$transaction([
    prisma.processedMessage.upsert({
      where: { waMessageId: job.waMessageId },
      create: { waMessageId: job.waMessageId },
      update: {}
    }),
    prisma.inboundMessageJob.delete({ where: { id: job.id } })
  ]);
}

export async function runInboundQueueSweep(): Promise<void> {
  const jobs = await prisma.inboundMessageJob.findMany({
    where: { failedAt: null, nextAttemptAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, waMessageId: true, message: true, contactName: true, attempts: true }
  });

  for (const job of jobs) {
    try {
      await processJob(job);
    } catch (err) {
      const attempts = job.attempts + 1;
      const terminal = attempts >= MAX_ATTEMPTS;
      const errorName = err instanceof Error ? err.name : "UnknownError";
      await prisma.inboundMessageJob.update({
        where: { id: job.id },
        data: {
          attempts,
          lastError: errorName.slice(0, 120),
          failedAt: terminal ? new Date() : null,
          nextAttemptAt: terminal ? new Date(Date.now() + 24 * 60 * 60 * 1000) : nextRetryDate(attempts)
        }
      });
      logger.error({ jobId: job.id, attempts, terminal, errorName }, "Fallo procesando mensaje entrante en cola");
    }
  }
}
