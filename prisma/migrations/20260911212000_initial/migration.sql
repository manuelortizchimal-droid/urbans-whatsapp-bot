-- CreateEnum
CREATE TYPE "Language" AS ENUM ('es', 'en');

-- CreateEnum
CREATE TYPE "Intent" AS ENUM ('rent', 'buy', 'insurance');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('home', 'auto', 'health', 'travel');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'house', 'villa');

-- CreateEnum
CREATE TYPE "PurchasePurpose" AS ENUM ('live', 'invest');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'language_selected', 'intent_selected', 'qualifying', 'qualified', 'qualified_pending_agent', 'human_active', 'follow_up', 'closed_won', 'closed_lost', 'abandoned');

-- CreateEnum
CREATE TYPE "ConversationStep" AS ENUM ('NEW', 'LANGUAGE_SELECT', 'MENU', 'RENT_ZONE', 'RENT_BUDGET', 'RENT_BEDROOMS', 'RENT_DATE', 'RENT_OCCUPANTS', 'RENT_FURNISHED', 'RENT_PETS', 'BUY_ZONE', 'BUY_BUDGET', 'BUY_PROPERTY_TYPE', 'BUY_BEDROOMS', 'BUY_PURPOSE', 'BUY_TIMELINE', 'INSURANCE_TYPE', 'INSURANCE_NAME', 'INSURANCE_LOCATION', 'INSURANCE_PHONE', 'INSURANCE_DETAILS', 'QUALIFIED', 'HUMAN_HANDOFF', 'HUMAN_ACTIVE', 'FOLLOW_UP', 'CLOSED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('META_ADS', 'FACEBOOK', 'INSTAGRAM', 'ORGANIC', 'MARKETPLACE', 'WHATSAPP_DIRECT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "wa_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "language" "Language",
    "intent" "Intent",
    "insurance_type" "InsuranceType",
    "zone" TEXT,
    "budget" TEXT,
    "bedrooms" INTEGER,
    "move_in_date" TEXT,
    "occupants" INTEGER,
    "furnished" BOOLEAN,
    "pets" BOOLEAN,
    "pets_detail" TEXT,
    "property_type" "PropertyType",
    "purchase_purpose" "PurchasePurpose",
    "purchase_timeline" TEXT,
    "insurance_city" TEXT,
    "insurance_phone" TEXT,
    "insurance_details" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'UNKNOWN',
    "campaign_id" TEXT,
    "adset_id" TEXT,
    "ad_id" TEXT,
    "utm_source" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "referral_headline" TEXT,
    "referral_source_url" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "conversation_step" "ConversationStep" NOT NULL DEFAULT 'NEW',
    "assigned_agent" TEXT,
    "reminder_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "human_handoff_at" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "wa_message_id" TEXT,
    "message_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "step_at_time" "ConversationStep" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_messages" (
    "id" TEXT NOT NULL,
    "wa_message_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_leases" (
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "job_leases_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_wa_id_key" ON "leads"("wa_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_conversation_step_idx" ON "leads"("conversation_step");

-- CreateIndex
CREATE INDEX "leads_last_message_at_idx" ON "leads"("last_message_at");

-- CreateIndex
CREATE INDEX "conversation_messages_lead_id_idx" ON "conversation_messages"("lead_id");

-- CreateIndex
CREATE INDEX "conversation_messages_wa_message_id_idx" ON "conversation_messages"("wa_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "processed_messages_wa_message_id_key" ON "processed_messages"("wa_message_id");

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
