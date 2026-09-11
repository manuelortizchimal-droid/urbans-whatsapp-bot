import { Lead } from "@prisma/client";
export interface NormalizedInboundMessage { waId:string; rawText:string|null; interactiveId:string|null; interactiveTitle:string|null; referral?:{sourceUrl?:string;sourceType?:string;sourceId?:string;headline?:string}; }
export interface StepResult { leadUpdate?:Partial<Lead>; nextStep?:Lead["conversationStep"]; }
export type FlowHandler=(lead:Lead,input:NormalizedInboundMessage)=>Promise<StepResult>;
