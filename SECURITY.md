# Seguridad — Urbans WhatsApp Automation

## Reglas de producción
- Nunca subir `.env` ni secretos al repositorio.
- Usar 2FA en Meta y hosting.
- Usar token permanente de Meta con permisos mínimos.
- Validar siempre `X-Hub-Signature-256` con `META_APP_SECRET`.
- Base PostgreSQL no expuesta públicamente; preferir red privada del proveedor.
- TLS obligatorio en conexiones externas y DB.
- `STORE_MESSAGE_CONTENT=false` por defecto para minimizar datos.
- API interna protegida por Bearer token largo y aleatorio.
- Restringir `ALLOWED_ORIGINS` al dashboard real cuando exista.
- Rotar secretos ante sospecha o cambio de personal.
- Revisar logs: no deben contener teléfonos, tokens ni secretos.
- Backups automáticos y restauración probada.

## Datos almacenados
Por defecto se guardan datos estructurados de calificación del lead y metadatos mínimos. El contenido textual completo de la conversación no se almacena salvo que `STORE_MESSAGE_CONTENT=true`.

## Retención
- Mensajes: `MESSAGE_RETENTION_DAYS` (30 días por defecto).
- IDs de deduplicación: `PROCESSED_MESSAGE_RETENTION_DAYS` (7 días por defecto).

## Antes de conectar el número real
1. Probar con número de prueba Meta.
2. Validar firmas rechazando requests no firmados.
3. Confirmar DB privada y backups.
4. Verificar que `.env` no está en Git.
5. Ejecutar pruebas del flujo ES/EN, renta/compra/seguros y handoff humano.
