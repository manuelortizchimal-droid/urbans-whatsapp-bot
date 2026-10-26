CREATE TABLE "OwnerProspect" (
 "id" TEXT NOT NULL,
 "source" TEXT NOT NULL,
 "sourceUrl" TEXT,
 "advertiserName" TEXT NOT NULL,
 "propertyType" TEXT NOT NULL,
 "location" TEXT,
 "address" TEXT,
 "priceMxn" DOUBLE PRECISION,
 "details" TEXT,
 "ownerConfirmed" BOOLEAN NOT NULL DEFAULT false,
 "score" INTEGER NOT NULL,
 "stage" TEXT NOT NULL DEFAULT 'identified',
 "contactConsent" BOOLEAN NOT NULL DEFAULT false,
 "consentEvidence" TEXT,
 "consentAt" TIMESTAMP(3),
 "fingerprint" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "OwnerProspect_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "OwnerProspect_score_check" CHECK ("score" BETWEEN 0 AND 100),
 CONSTRAINT "OwnerProspect_consent_check" CHECK (NOT "contactConsent" OR ("consentEvidence" IS NOT NULL AND "consentAt" IS NOT NULL))
);
CREATE UNIQUE INDEX "OwnerProspect_fingerprint_key" ON "OwnerProspect"("fingerprint");
CREATE INDEX "OwnerProspect_stage_idx" ON "OwnerProspect"("stage");
CREATE INDEX "OwnerProspect_score_idx" ON "OwnerProspect"("score");
