export function normalizeKeyword(input:string):string{return input.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toUpperCase();}
export function matchesKeyword(input:string,keywords:readonly string[]):boolean{const normalized=normalizeKeyword(input);return keywords.some(k=>normalizeKeyword(k)===normalized);}
export function extractFirstInteger(input:string):number|null{const match=input.match(/\d+/);if(!match)return null;const n=parseInt(match[0],10);return Number.isFinite(n)?n:null;}
export function isAffirmative(input:string):boolean{const n=normalizeKeyword(input);return["SI","YES","Y","S"].includes(n)}
export function isNegative(input:string):boolean{const n=normalizeKeyword(input);return["NO","N"].includes(n)}
