import { Lead, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { logger } from "../utils/logger";
import { NormalizedInboundMessage } from "../types/flow.types";
import { env } from "../config/env";

function deriveAttribution(input: NormalizedInboundMessage) {
  const referral = input.referral;
  if (!referral) return { source: "WHATSAPP_DIRECT" as const };
  let source: "META_ADS" | "FACEBOOK" | "INSTAGRAM" | "ORGANIC" | "UNKNOWN" = "UNKNOWN";
  const url = referral.sourceUrl?.toLowerCase() ?? "";
  if (referral.sourceType === "ad") source = "META_ADS"; else if (referral.sourceType === "post") source = "ORGANIC";
  if (url.includes("instagram.com")) source = "INSTAGRAM"; else if (url.includes("facebook.com") || url.includes("fb.com")) source = "FACEBOOK";
  let utmSource:string|undefined,utmCampaign:string|undefined,utmContent:string|undefined;
  try { if (referral.sourceUrl) { const parsed=new URL(referral.sourceUrl); utmSource=parsed.searchParams.get("utm_source")??undefined; utmCampaign=parsed.searchParams.get("utm_campaign")??undefined; utmContent=parsed.searchParams.get("utm_content")??undefined; } } catch {}
  return { source, adId: referral.sourceId, referralHeadline: referral.headline, referralSourceUrl: referral.sourceUrl, utmSource, utmCampaign, utmContent };
}

export async function findOrCreateLead(waId:string,phone:string,name:string|undefined,input:NormalizedInboundMessage):Promise<Lead>{
  const existing=await prisma.lead.findUnique({where:{waId}});
  if(existing) return prisma.lead.update({where:{id:existing.id},data:{lastMessageAt:new Date(),name:existing.name??name}});
  const attribution=deriveAttribution(input); logger.info({ attribution, hasWaId: Boolean(waId) },"Nuevo lead creado");
  return prisma.lead.create({data:{waId,phone,name,...attribution}});
}
export async function updateLead(id:string,data:Partial<Lead>):Promise<Lead>{return prisma.lead.update({where:{id},data:data as Prisma.LeadUpdateInput});}
export async function getLeadById(id:string):Promise<Lead|null>{return prisma.lead.findUnique({where:{id}})}
export async function listLeads(params:{status?:Lead["status"];intent?:Lead["intent"];limit?:number;cursor?:string;}):Promise<Lead[]>{return prisma.lead.findMany({where:{status:params.status,intent:params.intent},orderBy:{updatedAt:"desc"},take:params.limit??50,...(params.cursor?{cursor:{id:params.cursor},skip:1}:{})});}
export async function logConversationMessage(leadId:string,direction:"inbound"|"outbound",messageType:string,payload:unknown,stepAtTime:Lead["conversationStep"],waMessageId?:string|null):Promise<void>{try{await prisma.conversationMessage.create({data:{leadId,direction,messageType,payload:(env.STORE_MESSAGE_CONTENT?payload:{stored:false,reason:"data_minimization"}) as Prisma.InputJsonValue,stepAtTime,waMessageId:waMessageId??undefined}})}catch(err){logger.error({err,leadId},"No se pudo registrar mensaje en la bitacora de conversacion")}}
