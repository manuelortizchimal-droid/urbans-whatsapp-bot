import { Lead } from "@prisma/client";
import { sendButtons } from "../services/whatsapp.service";
import { copy } from "../utils/i18n";
import { normalizeKeyword } from "../utils/text";
import { NormalizedInboundMessage, StepResult } from "../types/flow.types";
import { ButtonIds } from "../config/constants";
export async function sendWelcomeLanguageSelector(waId:string){await sendButtons(waId,copy.es.welcomeBody,[{id:ButtonIds.LANG_ES,title:copy.es.langButtonEs},{id:ButtonIds.LANG_EN,title:copy.es.langButtonEn}])}
export async function handleLanguageSelect(lead:Lead,input:NormalizedInboundMessage):Promise<StepResult>{let language:"es"|"en"|null=null; if(input.interactiveId===ButtonIds.LANG_ES)language="es"; else if(input.interactiveId===ButtonIds.LANG_EN)language="en"; else if(input.rawText){const n=normalizeKeyword(input.rawText); if(["ES","ESPANOL","ESPAÑOL","SPANISH"].includes(n))language="es"; else if(["EN","ENGLISH","INGLES","INGLÉS"].includes(n))language="en";} if(!language){await sendWelcomeLanguageSelector(lead.waId);return{}} return{leadUpdate:{language,status:"language_selected"},nextStep:"MENU"}}
