import { ConversationStep, Lead } from "@prisma/client";
import { NormalizedInboundMessage, StepResult } from "../types/flow.types";
import * as languageFlow from "./language.flow";
import * as menuFlow from "./menu.flow";
import * as rentFlow from "./rent.flow";
import * as buyFlow from "./buy.flow";
import * as insuranceFlow from "./insurance.flow";

type Handler = (lead: Lead, input: NormalizedInboundMessage) => Promise<StepResult>;
type EntryFn = (lead: Lead) => Promise<void>;
const stepHandlers: Partial<Record<ConversationStep, Handler>> = {
  LANGUAGE_SELECT: languageFlow.handleLanguageSelect, MENU: menuFlow.handleMenu,
  RENT_ZONE: rentFlow.handleRentZone, RENT_BUDGET: rentFlow.handleRentBudget, RENT_BEDROOMS: rentFlow.handleRentBedrooms, RENT_DATE: rentFlow.handleRentDate, RENT_OCCUPANTS: rentFlow.handleRentOccupants, RENT_FURNISHED: rentFlow.handleRentFurnished, RENT_PETS: rentFlow.handleRentPets,
  BUY_ZONE: buyFlow.handleBuyZone, BUY_BUDGET: buyFlow.handleBuyBudget, BUY_PROPERTY_TYPE: buyFlow.handleBuyPropertyType, BUY_BEDROOMS: buyFlow.handleBuyBedrooms, BUY_PURPOSE: buyFlow.handleBuyPurpose, BUY_TIMELINE: buyFlow.handleBuyTimeline,
  INSURANCE_TYPE: insuranceFlow.handleInsuranceType, INSURANCE_NAME: insuranceFlow.handleInsuranceName, INSURANCE_LOCATION: insuranceFlow.handleInsuranceLocation, INSURANCE_PHONE: insuranceFlow.handleInsurancePhone, INSURANCE_DETAILS: insuranceFlow.handleInsuranceDetails,
};
const stepEntryHandlers: Partial<Record<ConversationStep, EntryFn>> = {
  MENU: menuFlow.enterMenu,
  RENT_ZONE: rentFlow.enterRentZone, RENT_BUDGET: rentFlow.enterRentBudget, RENT_BEDROOMS: rentFlow.enterRentBedrooms, RENT_DATE: rentFlow.enterRentDate, RENT_OCCUPANTS: rentFlow.enterRentOccupants, RENT_FURNISHED: rentFlow.enterRentFurnished, RENT_PETS: rentFlow.enterRentPets,
  BUY_ZONE: buyFlow.enterBuyZone, BUY_BUDGET: buyFlow.enterBuyBudget, BUY_PROPERTY_TYPE: buyFlow.enterBuyPropertyType, BUY_BEDROOMS: buyFlow.enterBuyBedrooms, BUY_PURPOSE: buyFlow.enterBuyPurpose, BUY_TIMELINE: buyFlow.enterBuyTimeline,
  INSURANCE_TYPE: insuranceFlow.enterInsuranceType, INSURANCE_NAME: insuranceFlow.enterInsuranceName, INSURANCE_LOCATION: insuranceFlow.enterInsuranceLocation, INSURANCE_PHONE: insuranceFlow.enterInsurancePhone, INSURANCE_DETAILS: insuranceFlow.enterInsuranceDetails,
};
export function hasHandlerForStep(step: ConversationStep): boolean { return Boolean(stepHandlers[step]); }
export async function dispatch(lead: Lead, input: NormalizedInboundMessage): Promise<StepResult> { const handler=stepHandlers[lead.conversationStep]; if(!handler)return{}; const result=await handler(lead,input); if(result.nextStep){const entry=stepEntryHandlers[result.nextStep]; if(entry){const mergedLead:Lead={...lead,...(result.leadUpdate??{}),conversationStep:result.nextStep}; await entry(mergedLead);}} return result; }
export { sendWelcomeLanguageSelector } from "./language.flow";
