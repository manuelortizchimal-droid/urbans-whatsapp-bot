import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

export async function runDataRetentionSweep(): Promise<void> {
  const messagesCutoff = daysAgo(env.MESSAGE_RETENTION_DAYS);
  const processedCutoff = daysAgo(env.PROCESSED_MESSAGE_RETENTION_DAYS);
  const failedInboundCutoff = hoursAgo(24);

  const [messages, processed, failedInbound] = await prisma.$transaction([
    prisma.conversationMessage.deleteMany({ where: { createdAt: { lt: messagesCutoff } } }),
    prisma.processedMessage.deleteMany({ where: { processedAt: { lt: processedCutoff } } }),
    prisma.inboundMessageJob.deleteMany({ where: { failedAt: { not: null, lt: failedInboundCutoff } } })
  ]);

  logger.info({
    deletedMessages: messages.count,
    deletedProcessedIds: processed.count,
    deletedFailedInboundJobs: failedInbound.count
  }, "Retención de datos aplicada");
}
