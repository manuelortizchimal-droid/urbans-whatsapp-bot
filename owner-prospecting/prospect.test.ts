import { test } from "node:test";
import assert from "node:assert/strict";
import { fingerprint, prospectScore, contactAllowed, ProspectInput } from "../src/services/ownerProspect.logic";
test("schema validates owner prospects",()=>{
 const p=ProspectInput.parse({source:"manual",advertiser_name:"  Owner  ",property_type:"consultorio"});
 assert.equal(p.advertiser_name,"Owner");
 assert.equal(p.owner_confirmed,false);
});
test("fingerprint is stable across whitespace and case",()=>{
 const a=ProspectInput.parse({source:"manual",advertiser_name:"Paulina   Zertuche",property_type:"consultorio",location:"Providencia"});
 const b=ProspectInput.parse({source:"manual",advertiser_name:"paulina zertuche",property_type:"consultorio",location:"Providencia"});
 assert.equal(fingerprint(a),fingerprint(b));
});
test("scoring bounded",()=>{
 const p=ProspectInput.parse({source:"manual",advertiser_name:"Owner",property_type:"consultorio",location:"Puerto Vallarta",owner_confirmed:true,price_mxn:5000,details:"Consultorio equipado con recepción, estacionamiento y salas privadas disponibles."});
 assert.ok(prospectScore(p)<=100);
});
test("no consent without evidence and date",()=>{
 assert.equal(contactAllowed(false),false);
 assert.equal(contactAllowed(true),false);
 assert.equal(contactAllowed(true,"written consent",new Date()),true);
});
