import { Lead } from "@prisma/client";
import { sendList, sendText } from "../services/whatsapp.service";
import { copy, t } from "../utils/i18n";
import { normalizeKeyword } from "../utils/text";
import { NormalizedInboundMessage, StepResult } from "../types/flow.types";
import { ListIds, Tags } from "../config/constants";
import { runHandoff } from "./handoff.flow";

export async function enterInsuranceType(lead: Lead): Promise<void> {
  const c = copy[lead.language ?? "es"];
  await sendList(lead.waId, c.insuranceIntro, c.insuranceListButton, [
    { id: ListIds.INSURANCE_HOME, title: c.insuranceHome }, { id: ListIds.INSURANCE_AUTO, title: c.insuranceAuto }, { id: ListIds.INSURANCE_HEALTH, title: c.insuranceHealth }, { id: ListIds.INSURANCE_TRAVEL, title: c.insuranceTravel },
  ]);
}
export async function handleInsuranceType(lead: Lead, input: NormalizedInboundMessage): Promise<StepResult> {
  const map: Record<string,{type:Lead["insuranceType"];tag:string}> = { [ListIds.INSURANCE_HOME]:{type:"home",tag:Tags.INSURANCE_HOME}, [ListIds.INSURANCE_AUTO]:{type:"auto",tag:Tags.INSURANCE_AUTO}, [ListIds.INSURANCE_HEALTH]:{type:"health",tag:Tags.INSURANCE_HEALTH}, [ListIds.INSURANCE_TRAVEL]:{type:"travel",tag:Tags.INSURANCE_TRAVEL} };
  const selected=input.interactiveId?map[input.interactiveId]:undefined; if(!selected){await enterInsuranceType(lead);return{}} return{leadUpdate:{insuranceType:selected.type,tags:Array.from(new Set([...lead.tags,selected.tag]))},nextStep:"INSURANCE_NAME"};
}
export async function enterInsuranceName(lead:Lead){await sendText(lead.waId,t(lead.language,"insuranceName"))}
export async function handleInsuranceName(lead:Lead,input:NormalizedInboundMessage):Promise<StepResult>{if(!input.rawText){await sendText(lead.waId,t(lead.language,"fallbackInvalid"));return{}} return{leadUpdate:{name:input.rawText},nextStep:"INSURANCE_LOCATION"}}
export async function enterInsuranceLocation(lead:Lead){await sendText(lead.waId,t(lead.language,"insuranceLocation"))}
export async function handleInsuranceLocation(lead:Lead,input:NormalizedInboundMessage):Promise<StepResult>{if(!input.rawText){await sendText(lead.waId,t(lead.language,"fallbackInvalid"));return{}} return{leadUpdate:{insuranceCity:input.rawText},nextStep:"INSURANCE_PHONE"}}
export async function enterInsurancePhone(lead:Lead){await sendText(lead.waId,t(lead.language,"insurancePhone"))}
export async function handleInsurancePhone(lead:Lead,input:NormalizedInboundMessage):Promise<StepResult>{if(!input.rawText){await sendText(lead.waId,t(lead.language,"fallbackInvalid"));return{}} const normalized=normalizeKeyword(input.rawText); const usesWhatsappNumber=["ESTE MISMO","THIS ONE","MISMO"].includes(normalized); return{leadUpdate:{insurancePhone:usesWhatsappNumber?lead.phone:input.rawText},nextStep:"INSURANCE_DETAILS"}}
function detailsQuestionKey(insuranceType:Lead["insuranceType"]):"insuranceDetailsHome"|"insuranceDetailsAuto"|"insuranceDetailsHealth"|"insuranceDetailsTravel"{switch(insuranceType){case"home":return"insuranceDetailsHome";case"auto":return"insuranceDetailsAuto";case"health":return"insuranceDetailsHealth";case"travel":default:return"insuranceDetailsTravel"}}
export async function enterInsuranceDetails(lead:Lead){await sendText(lead.waId,t(lead.language,detailsQuestionKey(lead.insuranceType)))}
export async function handleInsuranceDetails(lead:Lead,input:NormalizedInboundMessage):Promise<StepResult>{if(!input.rawText){await sendText(lead.waId,t(lead.language,"fallbackInvalid"));return{}} const updatedLead:Lead={...lead,insuranceDetails:input.rawText,status:"qualified"}; await runHandoff(updatedLead,"insuranceClosing"); return{leadUpdate:{insuranceDetails:input.rawText,status:"qualified_pending_agent",humanHandoffAt:new Date()},nextStep:"HUMAN_HANDOFF"}}
