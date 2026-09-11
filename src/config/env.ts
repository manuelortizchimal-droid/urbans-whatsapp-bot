import "dotenv/config";
import { z } from "zod";
const envSchema = z.object({
  PORT:z.coerce.number().default(3000), NODE_ENV:z.enum(["development","production","test"]).default("development"), PUBLIC_BASE_URL:z.string().url().optional(), DATABASE_URL:z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID:z.string().min(1), WHATSAPP_BUSINESS_ACCOUNT_ID:z.string().min(1), WHATSAPP_ACCESS_TOKEN:z.string().min(1), GRAPH_API_VERSION:z.string().default("v21.0"), WHATSAPP_VERIFY_TOKEN:z.string().min(1), META_APP_SECRET:z.string().min(1),
  ADVISOR_NOTIFICATION_NUMBER:z.string().optional().default(""), INTERNAL_API_KEY:z.string().min(1), CRM_WEBHOOK_URL:z.string().optional().default(""), CRM_WEBHOOK_SECRET:z.string().optional().default(""),
  ABANDONMENT_REMINDER_HOURS:z.coerce.number().default(6), ABANDONMENT_CLOSE_HOURS:z.coerce.number().default(48), ABANDONMENT_CRON_INTERVAL_MINUTES:z.coerce.number().default(30), RATE_LIMIT_WINDOW_MS:z.coerce.number().default(60000), RATE_LIMIT_MAX_REQUESTS:z.coerce.number().default(120),
  ALLOWED_ORIGINS:z.string().optional().default(""), STORE_MESSAGE_CONTENT:z.coerce.boolean().default(false), MESSAGE_RETENTION_DAYS:z.coerce.number().int().min(1).max(365).default(30), PROCESSED_MESSAGE_RETENTION_DAYS:z.coerce.number().int().min(1).max(30).default(7), LOG_LEVEL:z.string().default("info")
});
const parsed=envSchema.safeParse(process.env); if(!parsed.success){console.error("Variables de entorno invalidas o faltantes:"); console.error(parsed.error.flatten().fieldErrors); process.exit(1);} export const env=parsed.data;
export const GRAPH_API_BASE_URL=`https://graph.facebook.com/${env.GRAPH_API_VERSION}`;
export const WHATSAPP_MESSAGES_URL=`${GRAPH_API_BASE_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
