import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PUBLIC_BASE_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1),
  WHATSAPP_MODE: z.enum(["mock", "live"]).default("live"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(""),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional().default(""),
  WHATSAPP_ACCESS_TOKEN: z.string().optional().default(""),
  GRAPH_API_VERSION: z.string().regex(/^v\d+\.\d+$/).default("v21.0"),
  WHATSAPP_VERIFY_TOKEN: z.string().min(32),
  META_APP_SECRET: z.string().optional().default(""),
  ADVISOR_NOTIFICATION_NUMBER: z.string().optional().default(""),
  INTERNAL_API_KEY: z.string().min(32),
  CRM_WEBHOOK_URL: z.union([z.string().url(), z.literal("")]).optional().default(""),
  CRM_WEBHOOK_SECRET: z.string().optional().default(""),
  ABANDONMENT_REMINDER_HOURS: z.coerce.number().positive().max(168).default(6),
  ABANDONMENT_CLOSE_HOURS: z.coerce.number().positive().max(720).default(48),
  ABANDONMENT_CRON_INTERVAL_MINUTES: z.coerce.number().int().min(5).max(60).default(30),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(3600000).default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).max(10000).default(120),
  WEBHOOK_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(60).max(10000).default(1200),
  ALLOWED_ORIGINS: z.string().optional().default(""),
  STORE_MESSAGE_CONTENT: booleanFromEnv.default(false),
  MESSAGE_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  PROCESSED_MESSAGE_RETENTION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info")
}).superRefine((data, ctx) => {
  if (data.CRM_WEBHOOK_SECRET && data.CRM_WEBHOOK_SECRET.length < 32) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["CRM_WEBHOOK_SECRET"], message: "Debe tener al menos 32 caracteres" });
  }
  if (data.WHATSAPP_MODE === "live") {
    const required: Array<[keyof typeof data, number]> = [
      ["WHATSAPP_PHONE_NUMBER_ID", 5],
      ["WHATSAPP_BUSINESS_ACCOUNT_ID", 5],
      ["WHATSAPP_ACCESS_TOKEN", 50],
      ["META_APP_SECRET", 32]
    ];
    for (const [key, minLength] of required) {
      const value = String(data[key] ?? "");
      if (value.length < minLength) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `Requerido en modo live; mínimo ${minLength} caracteres` });
      }
    }
  }
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Variables de entorno invalidas o faltantes:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const GRAPH_API_BASE_URL = `https://graph.facebook.com/${env.GRAPH_API_VERSION}`;
export const WHATSAPP_MESSAGES_URL = `${GRAPH_API_BASE_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
