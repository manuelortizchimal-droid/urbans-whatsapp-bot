-- CreateTable
CREATE TABLE "inbound_message_jobs" (
    "id" TEXT NOT NULL,
    "wa_message_id" TEXT NOT NULL,
    "message" JSONB NOT NULL,
    "contact_name" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failed_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inbound_message_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inbound_message_jobs_wa_message_id_key" ON "inbound_message_jobs"("wa_message_id");

-- CreateIndex
CREATE INDEX "inbound_message_jobs_next_attempt_at_idx" ON "inbound_message_jobs"("next_attempt_at");

-- CreateIndex
CREATE INDEX "inbound_message_jobs_failed_at_idx" ON "inbound_message_jobs"("failed_at");
