export class AppError extends Error { public readonly statusCode:number; public readonly isOperational:boolean; constructor(message:string,statusCode=500,isOperational=true){super(message);this.statusCode=statusCode;this.isOperational=isOperational;Object.setPrototypeOf(this,new.target.prototype);Error.captureStackTrace(this,this.constructor);} }
export class InvalidSignatureError extends AppError{constructor(message="Firma de webhook invalida"){super(message,401)}}
export class WebhookVerificationError extends AppError{constructor(message="Token de verificacion invalido"){super(message,403)}}
export class WhatsAppApiError extends AppError{public readonly details?:unknown;constructor(message:string,details?:unknown){super(message,502);this.details=details}}
export class UnauthorizedError extends AppError{constructor(message="No autorizado"){super(message,401)}}
export class NotFoundError extends AppError{constructor(message="Recurso no encontrado"){super(message,404)}}
