import os from "os";
import { prisma } from "../db/prisma";
import { logger } from "./logger";

const owner = `${process.env.RAILWAY_REPLICA_ID ?? os.hostname()}:${process.pid}`;

type LeaseRow = { name: string };

async function acquireLease(name: string, leaseSeconds: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<LeaseRow[]>`
    INSERT INTO "job_leases" ("name", "owner", "locked_until", "updated_at")
    VALUES (${name}, ${owner}, NOW() + (${leaseSeconds} * INTERVAL '1 second'), NOW())
    ON CONFLICT ("name") DO UPDATE
      SET "owner" = EXCLUDED."owner",
          "locked_until" = EXCLUDED."locked_until",
          "updated_at" = NOW()
      WHERE "job_leases"."locked_until" <= NOW()
    RETURNING "name"
  `;
  return rows.length === 1;
}

async function releaseLease(name: string): Promise<void> {
  await prisma.jobLease.updateMany({
    where: { name, owner },
    data: { lockedUntil: new Date(0) }
  });
}

export async function withJobLease(name: string, leaseSeconds: number, job: () => Promise<void>): Promise<void> {
  const acquired = await acquireLease(name, leaseSeconds);
  if (!acquired) {
    logger.debug({ job: name }, "Job omitido: lease activo en otra replica");
    return;
  }

  const startedAt = Date.now();
  try {
    await job();
    logger.info({ job: name, durationMs: Date.now() - startedAt }, "Job completado");
  } finally {
    try {
      await releaseLease(name);
    } catch (err) {
      logger.error({ err, job: name }, "No se pudo liberar lease de job");
    }
  }
}
