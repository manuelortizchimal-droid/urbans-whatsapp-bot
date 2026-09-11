import pino from "pino"; import { env } from "../config/env";
export const logger=pino({level:env.LOG_LEVEL,redact:{paths:["req.headers.authorization","*.access_token","*.accessToken","*.WHATSAPP_ACCESS_TOKEN","*.META_APP_SECRET","*.appSecret","*.token","*.password","*.phone","*.waId","*.to","*.from"],censor:"[REDACTED]"},transport:env.NODE_ENV==="development"?{target:"pino-pretty",options:{colorize:true,translateTime:"HH:MM:ss"}}:undefined,base:{service:"urbans-whatsapp-bot"}});
export type Logger=typeof logger;
