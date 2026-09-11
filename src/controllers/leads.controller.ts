import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getLeadById, listLeads, updateLead } from "../services/lead.service";
import { NotFoundError } from "../utils/errors";

const leadStatusSchema = z.enum([
  "new", "language_selected", "intent_selected", "qualifying", "qualified",
  "qualified_pending_agent", "human_active", "follow_up", "closed_won",
  "closed_lost", "abandoned"
]);

const intentSchema = z.enum(["rent", "buy", "insurance"]);

const conversationStepSchema = z.enum([
  "NEW", "LANGUAGE_SELECT", "MENU", "RENT_ZONE", "RENT_BUDGET", "RENT_BEDROOMS",
  "RENT_DATE", "RENT_OCCUPANTS", "RENT_FURNISHED", "RENT_PETS", "BUY_ZONE",
  "BUY_BUDGET", "BUY_PROPERTY_TYPE", "BUY_BEDROOMS", "BUY_PURPOSE", "BUY_TIMELINE",
  "INSURANCE_TYPE", "INSURANCE_NAME", "INSURANCE_LOCATION", "INSURANCE_PHONE",
  "INSURANCE_DETAILS", "QUALIFIED", "HUMAN_HANDOFF", "HUMAN_ACTIVE", "FOLLOW_UP", "CLOSED"
]);

const listQuerySchema = z.object({
  status: leadStatusSchema.optional(),
  intent: intentSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().min(1).max(64).optional()
});

export async function listLeadsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listQuerySchema.parse(req.query);
    const leads = await listLeads({ status: q.status, intent: q.intent, limit: q.limit, cursor: q.cursor });
    res.json({ data: leads });
  } catch (e) { next(e); }
}

export async function getLeadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await getLeadById(req.params.id);
    if (!lead) throw new NotFoundError("Lead no encontrado");
    res.json({ data: lead });
  } catch (e) { next(e); }
}

const patchLeadSchema = z.object({
  status: leadStatusSchema.optional(),
  assignedAgent: z.string().trim().min(1).max(120).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  conversationStep: conversationStepSchema.optional()
}).strict();

export async function patchLeadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = patchLeadSchema.parse(req.body);
    const existing = await getLeadById(req.params.id);
    if (!existing) throw new NotFoundError("Lead no encontrado");
    const lead = await updateLead(req.params.id, body as any);
    res.json({ data: lead });
  } catch (e) { next(e); }
}
