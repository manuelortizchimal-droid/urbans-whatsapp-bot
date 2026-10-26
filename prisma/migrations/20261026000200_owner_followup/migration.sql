CREATE TABLE "OwnerFollowUp" (
 "id" TEXT NOT NULL,
 "prospectId" TEXT NOT NULL,
 "dueAt" TIMESTAMP(3) NOT NULL,
 "type" TEXT NOT NULL DEFAULT 'call',
 "status" TEXT NOT NULL DEFAULT 'pending',
 "notes" TEXT,
 "outcome" TEXT,
 "completedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "OwnerFollowUp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OwnerFollowUp_dueAt_status_idx" ON "OwnerFollowUp"("dueAt","status");
CREATE INDEX "OwnerFollowUp_prospectId_idx" ON "OwnerFollowUp"("prospectId");
ALTER TABLE "OwnerFollowUp" ADD CONSTRAINT "OwnerFollowUp_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "OwnerProspect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
