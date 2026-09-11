export interface WhatsAppWebhookBody { object:string; entry:WhatsAppEntry[]; }
export interface WhatsAppEntry { id:string; changes:WhatsAppChange[]; }
export interface WhatsAppChange { field:string; value:WhatsAppValue; }
export interface WhatsAppValue { messaging_product:"whatsapp"; metadata:{display_phone_number:string;phone_number_id:string}; contacts?:WhatsAppContact[]; messages?:WhatsAppMessage[]; statuses?:WhatsAppStatus[]; }
export interface WhatsAppContact { profile:{name?:string}; wa_id:string; }
export interface WhatsAppReferral { source_url?:string; source_type?:string; source_id?:string; headline?:string; body?:string; media_type?:string; image_url?:string; video_url?:string; thumbnail_url?:string; ctwa_clid?:string; }
export interface WhatsAppMessage { from:string; id:string; timestamp:string; type:"text"|"interactive"|"button"|"image"|"audio"|"video"|"document"|"location"|"sticker"|"unknown"|"order"|"contacts"|"system"; text?:{body:string}; interactive?:{type:"button_reply"|"list_reply";button_reply?:{id:string;title:string};list_reply?:{id:string;title:string;description?:string}}; referral?:WhatsAppReferral; context?:{from?:string;id?:string}; }
export interface WhatsAppStatus { id:string; status:"sent"|"delivered"|"read"|"failed"; timestamp:string; recipient_id:string; errors?:Array<{code:number;title:string;message?:string}>; }
export interface OutboundTextMessage { messaging_product:"whatsapp";to:string;type:"text";text:{body:string;preview_url?:boolean}; }
export interface OutboundButtonMessage { messaging_product:"whatsapp";to:string;type:"interactive";interactive:{type:"button";body:{text:string};action:{buttons:Array<{type:"reply";reply:{id:string;title:string}}>}}; }
export interface OutboundListMessage { messaging_product:"whatsapp";to:string;type:"interactive";interactive:{type:"list";body:{text:string};action:{button:string;sections:Array<{title?:string;rows:Array<{id:string;title:string;description?:string}>}>}}; }
export type OutboundMessage=OutboundTextMessage|OutboundButtonMessage|OutboundListMessage;
