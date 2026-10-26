import {listFollowUps,createFollowUp,patchFollowUp} from "../controllers/ownerFollowUps.controller";
import crypto from "crypto";
import { Request, Response, NextFunction, Router } from "express";
import { env } from "../config/env";
import { createOwnerProspect, listOwnerProspects, patchOwnerProspect } from "../controllers/ownerProspects.controller";
import { readFileSync } from "fs";
import { join } from "path";

export const crmRouter = Router();
const cookieName = "urbans_crm_session";
const ttl = 8 * 60 * 60 * 1000;
const loginWindow = new Map<string,{count:number;since:number}>();
function token(ts:number){return crypto.createHmac("sha256",env.CRM_SESSION_SECRET ?? "").update(String(ts)).digest("hex")}
function valid(req:Request){
 const raw = (req.headers.cookie || "").split(";").map(x=>x.trim()).find(x=>x.startsWith(cookieName+"="))?.slice(cookieName.length+1);
 if(!raw)return false;
 const [time,signature]=raw.split(".");
 const ts=Number(time);
 if(!Number.isSafeInteger(ts)||ts>Date.now()+60000||Date.now()-ts>ttl||ts<0||!signature)return false;
 const expected=Buffer.from(token(ts),"hex"),actual=Buffer.from(signature,"hex");
 return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}
function guard(req:Request,res:Response,next:NextFunction){
 if(!valid(req)){res.status(401).json({error:"Sesión no autorizada"});return;}
 next();
}
function sameOrigin(req:Request){
 const origin=req.headers.origin;
 if(!origin)return false;
 try {const url=new URL(origin);return url.host===req.get("host")&&url.protocol==="https:" || (env.NODE_ENV!=="production"&&url.host===req.get("host")&&url.protocol==="http:");}catch{return false;}
}
crmRouter.post("/login",(req,res)=>{
 const ip=req.ip||"unknown",now=Date.now();
 const entry=loginWindow.get(ip);
 const item=entry&&now-entry.since<15*60*1000?entry:{count:0,since:now};
 if(item.count>=8){res.status(429).json({error:"Demasiados intentos"});return;}
 if(!sameOrigin(req)){res.status(403).json({error:"Origen no permitido"});return;}
 const supplied=Buffer.from(typeof req.body?.password==="string"?req.body.password:"");
 const expected=Buffer.from(env.CRM_ADMIN_PASSWORD ?? "");
 if(supplied.length!==expected.length||!crypto.timingSafeEqual(supplied,expected)){
  item.count++;loginWindow.set(ip,item);res.status(401).json({error:"Contraseña incorrecta"});return;
 }
 loginWindow.delete(ip);
 const ts=Date.now();
 res.setHeader("Set-Cookie",cookieName+"="+ts+"."+token(ts)+"; HttpOnly; Secure; SameSite=Strict; Path=/crm; Max-Age="+Math.floor(ttl/1000));
 res.json({ok:true});
});
crmRouter.post("/logout",(_req,res)=>{res.setHeader("Set-Cookie",cookieName+"=; HttpOnly; Secure; SameSite=Strict; Path=/crm; Max-Age=0");res.json({ok:true});});
crmRouter.get("/session",(req,res)=>{res.json({authenticated:valid(req)})});
crmRouter.get("/",(_req,res)=>{res.type("html").send(readFileSync(join(process.cwd(),"crm","index.html"),"utf8"))});
crmRouter.use("/api",guard,(req,res,next)=>{
 if(req.method!=="GET"&&!sameOrigin(req)){res.status(403).json({error:"Origen no permitido"});return;}
 res.setHeader("Cache-Control","no-store");next();
});
crmRouter.get("/api/owner-prospects",listOwnerProspects);
crmRouter.post("/api/owner-prospects",createOwnerProspect);
crmRouter.patch("/api/owner-prospects/:id",patchOwnerProspect);

crmRouter.get("/api/follow-ups",listFollowUps);
crmRouter.post("/api/follow-ups",createFollowUp);
crmRouter.patch("/api/follow-ups/:id",patchFollowUp);
