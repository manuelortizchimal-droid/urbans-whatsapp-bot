import {Request,Response,NextFunction} from "express";
import {z} from "zod";
import {prisma} from "../db/prisma";
const schema=z.object({
 prospectId:z.string().min(1),
 dueAt:z.iso.datetime({offset:true}),
 type:z.enum(["call","whatsapp","email","meeting","other"]).default("call"),
 notes:z.string().max(2000).optional()
}).strict();
const update=z.object({
 status:z.enum(["pending","completed","cancelled"]).optional(),
 dueAt:z.iso.datetime({offset:true}).optional(),
 notes:z.string().max(2000).nullable().optional(),
 outcome:z.string().max(2000).nullable().optional()
}).strict();
export async function listFollowUps(req:Request,res:Response,next:NextFunction){try{
 const q=z.object({status:z.enum(["pending","completed","cancelled","all"]).default("pending"),prospectId:z.string().optional(),limit:z.coerce.number().int().min(1).max(200).default(100)}).parse(req.query);
 const data=await prisma.ownerFollowUp.findMany({where:{...(q.status==="all"?{}:{status:q.status}),...(q.prospectId?{prospectId:q.prospectId}:{})},orderBy:{dueAt:"asc"},take:q.limit,include:{prospect:{select:{id:true,advertiserName:true,location:true,stage:true,contactConsent:true}}}});
 res.json({data,now:new Date().toISOString()});
}catch(e){next(e)}}
export async function createFollowUp(req:Request,res:Response,next:NextFunction){try{
 const input=schema.parse(req.body);
 const prospect=await prisma.ownerProspect.findUnique({where:{id:input.prospectId},select:{id:true}});
 if(!prospect){res.status(404).json({error:"Prospecto no encontrado"});return}
 const data=await prisma.ownerFollowUp.create({data:{prospectId:input.prospectId,dueAt:new Date(input.dueAt),type:input.type,notes:input.notes}});
 res.status(201).json({data});
}catch(e){next(e)}}
export async function patchFollowUp(req:Request,res:Response,next:NextFunction){try{
 const input=update.parse(req.body);
 const existing=await prisma.ownerFollowUp.findUnique({where:{id:req.params.id}});
 if(!existing){res.status(404).json({error:"Seguimiento no encontrado"});return}
 const data=await prisma.ownerFollowUp.update({where:{id:req.params.id},data:{
 ...(input.status?{status:input.status,completedAt:input.status==="completed"?new Date():null}:{}),
 ...(input.dueAt?{dueAt:new Date(input.dueAt)}:{}),
 ...(input.notes!==undefined?{notes:input.notes}:{}),
 ...(input.outcome!==undefined?{outcome:input.outcome}:{})
 }});
 res.json({data});
}catch(e){next(e)}}
