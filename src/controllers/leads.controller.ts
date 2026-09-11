import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getLeadById, listLeads, updateLead } from "../services/lead.service";
import { NotFoundError } from "../utils/errors";
const listQuerySchema=z.object({status:z.string().optional(),intent:z.string().optional(),limit:z.coerce.number().min(1).max(200).optional(),cursor:z.string().optional()});
export async function listLeadsHandler(req:Request,res:Response,next:NextFunction){try{const q=listQuerySchema.parse(req.query); const leads=await listLeads({status:q.status as any,intent:q.intent as any,limit:q.limit,cursor:q.cursor}); res.json({data:leads});}catch(e){next(e)}}
export async function getLeadHandler(req:Request,res:Response,next:NextFunction){try{const lead=await getLeadById(req.params.id); if(!lead) throw new NotFoundError("Lead no encontrado"); res.json({data:lead});}catch(e){next(e)}}
const patchLeadSchema=z.object({status:z.enum(["new","language_selected","intent_selected","qualifying","qualified","qualified_pending_agent","human_active","follow_up","closed_won","closed_lost","abandoned"]).optional(),assignedAgent:z.string().nullable().optional(),notes:z.string().nullable().optional(),conversationStep:z.string().optional()});
export async function patchLeadHandler(req:Request,res:Response,next:NextFunction){try{const body=patchLeadSchema.parse(req.body); const existing=await getLeadById(req.params.id); if(!existing) throw new NotFoundError("Lead no encontrado"); const lead=await updateLead(req.params.id,body as any); res.json({data:lead});}catch(e){next(e)}}
