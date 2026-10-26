import { createHash } from 'node:crypto';
import { z } from 'zod';
// Isolated module: not mounted in the production API until authentication, migrations and tests pass.
export const ProspectInput = z.object({
 source: z.enum(['facebook_group','marketplace','facebook_ad','manual']),
 source_url: z.string().url().optional(),
 advertiser_name: z.string().trim().min(1).max(200),
 property_type: z.string().trim().min(1).max(120),
 location: z.string().max(250).optional(),
 address: z.string().max(300).optional(),
 price_mxn: z.number().nonnegative().optional(),
 details: z.string().max(4000).optional(),
 owner_confirmed: z.boolean().default(false)
});
export type ProspectInput = z.infer<typeof ProspectInput>;
export function fingerprint(p: ProspectInput): string {
 const normalize = (s?:string) => (s || '').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 return createHash('sha256').update([normalize(p.advertiser_name),normalize(p.property_type),normalize(p.location),normalize(p.address),normalize(p.source_url)].join('|')).digest('hex');
}
export function prospectScore(p: ProspectInput): number {
 let score=20;
 if (p.property_type.toLowerCase().includes('consultorio')) score+=20;
 if (p.location) score+=10;
 if (p.price_mxn !== undefined) score+=8;
 if (p.details && p.details.length>60) score+=8;
 if (p.owner_confirmed) score+=20;
 if (/vallarta|bucer[ií]as|bah[ií]a de banderas|mezcales|nuevo nayarit/i.test(p.location||'')) score+=14;
 return Math.min(100,score);
}
export function contactAllowed(consent:boolean,evidence?:string,consentAt?:Date):boolean {
 return consent && Boolean(evidence?.trim()) && Boolean(consentAt);
}
