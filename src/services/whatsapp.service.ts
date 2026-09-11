import axios,{AxiosError} from "axios";
import { env,WHATSAPP_MESSAGES_URL } from "../config/env";
import { logger } from "../utils/logger";
import { WhatsAppApiError } from "../utils/errors";
import { OutboundMessage } from "../types/whatsapp.types";
import { buildButtonMessage,buildListMessage,buildTextMessage } from "../whatsapp/messages";

const client=axios.create({timeout:10000,headers:{Authorization:`Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,"Content-Type":"application/json"}});
const MAX_RETRIES=3;
const RETRYABLE_STATUS_CODES=new Set([429,500,502,503,504]);
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));

const mockOutbox = new Map<string, OutboundMessage[]>();
function queueMock(payload: OutboundMessage) {
  const to = payload.to;
  const current = mockOutbox.get(to) ?? [];
  current.push(payload);
  mockOutbox.set(to, current.slice(-20));
}
export function drainMockOutbox(to:string):OutboundMessage[]{
  const items=mockOutbox.get(to)??[];
  mockOutbox.delete(to);
  return items;
}

async function sendToGraphApi(payload:OutboundMessage):Promise<{messageId:string|null}>{
  if(env.WHATSAPP_MODE==="mock"){
    queueMock(payload);
    const messageId=`mock-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    logger.info({type:payload.type,messageId},"Mensaje WhatsApp simulado en modo mock");
    return{messageId};
  }
  let lastError:unknown;
  for(let attempt=1;attempt<=MAX_RETRIES;attempt++){
    try{
      const response=await client.post(WHATSAPP_MESSAGES_URL,payload);
      const messageId=response.data?.messages?.[0]?.id??null;
      logger.info({type:payload.type,messageId,attempt},"Mensaje WhatsApp enviado");
      return{messageId};
    }catch(err){
      lastError=err;
      const axiosErr=err as AxiosError<any>;
      const status=axiosErr.response?.status;
      logger.warn({type:payload.type,status,attempt},"Fallo al enviar mensaje WhatsApp");
      const retryable=status!==undefined&&RETRYABLE_STATUS_CODES.has(status);
      if(!retryable||attempt===MAX_RETRIES)break;
      await sleep(500*2**(attempt-1));
    }
  }
  const axiosErr=lastError as AxiosError<any>;
  throw new WhatsAppApiError("No se pudo enviar el mensaje a WhatsApp Cloud API",{status:axiosErr?.response?.status});
}

export async function sendText(to:string,body:string){return sendToGraphApi(buildTextMessage(to,body))}
export async function sendButtons(to:string,bodyText:string,buttons:Array<{id:string;title:string}>){return sendToGraphApi(buildButtonMessage(to,bodyText,buttons))}
export async function sendList(to:string,bodyText:string,buttonLabel:string,rows:Array<{id:string;title:string;description?:string}>,sectionTitle?:string){return sendToGraphApi(buildListMessage(to,bodyText,buttonLabel,rows,sectionTitle))}
export async function markAsRead(waMessageId:string):Promise<void>{
  if(env.WHATSAPP_MODE==="mock") return;
  try{await client.post(WHATSAPP_MESSAGES_URL,{messaging_product:"whatsapp",status:"read",message_id:waMessageId})}
  catch(err){logger.warn({waMessageId},"No se pudo marcar mensaje como leido")}
}
