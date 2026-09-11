import { Request,Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { findOrCreateLead,getLeadById } from "../services/lead.service";
import { processInboundMessage } from "../services/flow.service";
import { drainMockOutbox } from "../services/whatsapp.service";
import { NormalizedInboundMessage } from "../types/flow.types";

const mockInputSchema=z.object({
  waId:z.string().min(6).max(32),
  name:z.string().max(120).optional(),
  text:z.string().max(2000).optional(),
  interactiveId:z.string().max(200).optional(),
  interactiveTitle:z.string().max(200).optional()
}).refine(v=>Boolean(v.text||v.interactiveId),{message:"text o interactiveId es requerido"});

export async function mockMessageHandler(req:Request,res:Response){
  if(env.WHATSAPP_MODE!=="mock"){
    res.status(404).json({error:"Not found"});
    return;
  }
  const parsed=mockInputSchema.safeParse(req.body);
  if(!parsed.success){
    res.status(400).json({error:"Invalid input",details:parsed.error.flatten().fieldErrors});
    return;
  }
  const body=parsed.data;
  const input:NormalizedInboundMessage={
    waId:body.waId,
    rawText:body.text?.trim()??null,
    interactiveId:body.interactiveId??null,
    interactiveTitle:body.interactiveTitle??null
  };
  const lead=await findOrCreateLead(body.waId,body.waId,body.name,input);
  await processInboundMessage(lead,input);
  const updated=await getLeadById(lead.id);
  const replies=drainMockOutbox(body.waId);
  res.json({mode:"mock",lead:updated,replies});
}
