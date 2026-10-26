import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ProspectInput, fingerprint, prospectScore, contactAllowed } from "../services/ownerProspect.logic";
const stages = z.enum(["identified","pending","contactable","contacted","interested","negotiation","captured","discarded"]);
const createSchema = ProspectInput.strict();
const patchSchema = z.object({
 stage: stages.optional(),
 ownerConfirmed: z.boolean().optional(),
 contactConsent: z.boolean().optional(),
 consentEvidence: z.string().trim().min(10).max(1000).nullable().optional(),
 consentAt: z.coerce.date().nullable().optional()
}).strict();
export async function createOwnerProspect(req: Request,res: Response,next: NextFunction) {
 try {
  const input = createSchema.parse(req.body);
  const fp = fingerprint(input);
  const existing = await prisma.ownerProspect.findUnique({where:{fingerprint:fp}});
  if(existing) { res.status(200).json({data:existing,duplicate:true}); return; }
  const data = await prisma.ownerProspect.create({data:{
   source:input.source,sourceUrl:input.source_url,advertiserName:input.advertiser_name,
   propertyType:input.property_type,location:input.location,address:input.address,
   priceMxn:input.price_mxn,details:input.details,ownerConfirmed:input.owner_confirmed,
   score:prospectScore(input),fingerprint:fp
  }});
  res.status(201).json({data});
 } catch(e){next(e);}
}
export async function listOwnerProspects(req: Request,res: Response,next: NextFunction) {
 try {
  const q=z.object({stage:stages.optional(),limit:z.coerce.number().int().min(1).max(100).default(50)}).parse(req.query);
  const data=await prisma.ownerProspect.findMany({where:q.stage?{stage:q.stage}:{},orderBy:{createdAt:"desc"},take:q.limit});
  res.json({data});
 } catch(e){next(e);}
}
export async function patchOwnerProspect(req: Request,res: Response,next: NextFunction) {
 try {
  const input=patchSchema.parse(req.body);
  const existing=await prisma.ownerProspect.findUnique({where:{id:req.params.id}});
  if(!existing){res.status(404).json({error:"Prospecto no encontrado"});return;}
  const consent=input.contactConsent ?? existing.contactConsent;
  const evidence=input.consentEvidence===undefined?existing.consentEvidence:input.consentEvidence;
  const at=input.consentAt===undefined?existing.consentAt:input.consentAt;
  if(consent && !contactAllowed(consent,evidence??undefined,at??undefined)){
   res.status(400).json({error:"Consentimiento requiere fecha y evidencia verificable"});return;
  }
  if(input.stage==="contacted" && !consent){
   res.status(400).json({error:"No marcar como contactado sin consentimiento registrado"});return;
  }
  const data=await prisma.ownerProspect.update({where:{id:req.params.id},data:{
   ...(input.stage!==undefined?{stage:input.stage}:{}),
   ...(input.ownerConfirmed!==undefined?{ownerConfirmed:input.ownerConfirmed}:{}),
   ...(input.contactConsent!==undefined?{contactConsent:input.contactConsent}:{}),
   ...(input.consentEvidence!==undefined?{consentEvidence:input.consentEvidence}:{}),
   ...(input.consentAt!==undefined?{consentAt:input.consentAt}:{})
  }});
  res.json({data});
 }catch(e){next(e);}
}
