const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const PORT=process.env.PORT||'3299', BASE='http://127.0.0.1:'+PORT;
const key=process.env.INTERNAL_API_KEY;
if(!key)throw Error('INTERNAL_API_KEY missing');
const headers={Authorization:'Bearer '+key,'Content-Type':'application/json'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function req(path,method='GET',body,auth=true){
 const r=await fetch(BASE+path,{method,headers:auth?headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json().catch(()=>null);return {status:r.status,data};
}
async function main(){
 const child=spawn(process.execPath,['dist/server.js'],{env:{...process.env,PORT},stdio:'pipe'});
 let logs='';child.stderr.on('data',d=>logs+=String(d));child.stdout.on('data',d=>logs+=String(d));
 try{
  let healthy=false;for(let i=0;i<80;i++){try{const r=await fetch(BASE+'/health');if(r.ok){healthy=true;break}}catch{}await sleep(250)}
  assert.ok(healthy,'Server failed healthcheck '+logs.slice(-1000));
  assert.equal((await req('/api/owner-prospects')).status,200);
  assert.equal((await req('/api/owner-prospects','GET',undefined,false)).status,401);
  const payload={source:'manual',advertiser_name:'QA Owner '+Date.now(),property_type:'departamento',location:'Puerto Vallarta',details:'Public listing for integration testing'};
  const created=await req('/api/owner-prospects','POST',payload);assert.equal(created.status,201,JSON.stringify(created));const id=created.data.data.id;
  const dup=await req('/api/owner-prospects','POST',payload);assert.equal(dup.status,200);assert.equal(dup.data.duplicate,true);
  const denied=await req('/api/owner-prospects/'+id,'PATCH',{stage:'contacted'});assert.equal(denied.status,400);
  const consent=await req('/api/owner-prospects/'+id,'PATCH',{contactConsent:true,consentEvidence:'QA simulated consent - not real',consentAt:new Date().toISOString()});assert.equal(consent.status,200,JSON.stringify(consent));
  const contacted=await req('/api/owner-prospects/'+id,'PATCH',{stage:'contacted'});assert.equal(contacted.status,200,JSON.stringify(contacted));
  const list=await req('/api/owner-prospects?stage=contacted');assert.ok(list.data.data.some(x=>x.id===id));
  const invalid=await req('/api/owner-prospects','POST',{source:'manual',advertiser_name:'Bad',property_type:'house',unexpected:true});assert.equal(invalid.status,400);
  const {prisma}=require('../dist/db/prisma.js');await prisma.ownerProspect.delete({where:{id}});await prisma.$disconnect();
  console.log('Owner prospect API integration tests passed');
 }finally{child.kill('SIGTERM')}
}
main().catch(e=>{console.error(e);process.exitCode=1});
