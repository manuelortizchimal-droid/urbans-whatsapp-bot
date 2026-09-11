import { Lead } from "@prisma/client";
import { sendText } from "../services/whatsapp.service";
import { copy, CopyKey } from "../utils/i18n";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { notifyCrm } from "../services/crm.service";

const YES_NO = { es: { yes: "Sí", no: "No" }, en: { yes: "Yes", no: "No" } } as const;

function buildInternalSummary(lead: Lead): string {
  const lines: string[] = [];
  const langLabel = lead.language === "en" ? "English" : "Español";
  const yn = lead.language === "en" ? YES_NO.en : YES_NO.es;
  if (lead.intent === "rent") {
    lines.push("LEAD NUEVO — RENTA"); lines.push(`Idioma: ${langLabel}`); lines.push(`Zona: ${lead.zone ?? "-"}`); lines.push(`Presupuesto: ${lead.budget ?? "-"}`); lines.push(`Recámaras: ${lead.bedrooms ?? "-"}`); lines.push(`Fecha: ${lead.moveInDate ?? "-"}`); lines.push(`Personas: ${lead.occupants ?? "-"}`); lines.push(`Amueblado: ${lead.furnished === null ? "-" : lead.furnished ? yn.yes : yn.no}`); lines.push(`Mascotas: ${lead.pets === null ? "-" : lead.pets ? yn.yes : yn.no}`);
  } else if (lead.intent === "buy") {
    lines.push("LEAD NUEVO — COMPRA"); lines.push(`Idioma: ${langLabel}`); lines.push(`Zona: ${lead.zone ?? "-"}`); lines.push(`Presupuesto: ${lead.budget ?? "-"}`); lines.push(`Tipo de propiedad: ${lead.propertyType ?? "-"}`); lines.push(`Recámaras: ${lead.bedrooms ?? "-"}`); lines.push(`Uso: ${lead.purchasePurpose ?? "-"}`); lines.push(`Plazo de compra: ${lead.purchaseTimeline ?? "-"}`);
  } else if (lead.intent === "insurance") {
    lines.push("LEAD NUEVO — SEGUROS"); lines.push(`Idioma: ${langLabel}`); lines.push(`Tipo de seguro: ${lead.insuranceType ?? "-"}`); lines.push(`Nombre: ${lead.name ?? "-"}`); lines.push(`Ciudad/Estado: ${lead.insuranceCity ?? "-"}`); lines.push(`Teléfono: ${lead.insurancePhone ?? lead.phone}`); lines.push(`Detalles: ${lead.insuranceDetails ?? "-"}`);
  } else { lines.push("LEAD NUEVO"); lines.push(`Idioma: ${langLabel}`); }
  lines.push(`Teléfono WhatsApp: ${lead.phone}`); lines.push(`Fuente: ${lead.source}${lead.adId ? ` (ad_id: ${lead.adId})` : ""}`); lines.push(`Tags: ${lead.tags.join(", ") || "-"}`); lines.push(`Estado: Qualified`); lines.push(`Lead ID: ${lead.id}`);
  return lines.join("\n");
}

export async function runHandoff(lead: Lead, closingKey: CopyKey): Promise<void> {
  const c = copy[lead.language ?? "es"];
  try { await sendText(lead.waId, c[closingKey] as string); } catch (err) { logger.error({ err, leadId: lead.id }, "Fallo al enviar mensaje de cierre al lead"); }
  if (env.ADVISOR_NOTIFICATION_NUMBER) { try { await sendText(env.ADVISOR_NOTIFICATION_NUMBER, buildInternalSummary(lead)); } catch (err) { logger.error({ err, leadId: lead.id }, "Fallo al enviar resumen interno al asesor"); } } else { logger.warn("ADVISOR_NOTIFICATION_NUMBER no configurado: no se envio resumen interno por WhatsApp"); }
  try { await notifyCrm(lead); } catch (err) { logger.error({ err, leadId: lead.id }, "Fallo al notificar CRM externo"); }
  logger.info({ leadId: lead.id, intent: lead.intent }, "Lead calificado y enviado a handoff humano");
}
