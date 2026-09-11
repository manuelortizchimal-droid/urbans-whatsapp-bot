# Seguridad — Urbans WhatsApp Automation

## Regla obligatoria: versión máxima + auditoría previa
Toda solicitud, cambio, integración, despliegue o entrega de este proyecto debe pasar primero por una auditoría técnica y de seguridad antes de considerarse terminada. No se entrega una versión funcional/intermedia como versión final.

Regla operativa obligatoria:
1. Auditar seguridad, errores, datos, permisos, secretos, exposición de red, dependencias, validaciones, logs, backups, migraciones, resiliencia, escalabilidad y recuperación.
2. Corregir automáticamente todo hallazgo que pueda resolverse sin una decisión de negocio del usuario.
3. Ejecutar build, validación de tipos/esquema, migraciones y pruebas funcionales relevantes.
4. Confirmar que el servicio inicia, permanece estable y completa los flujos críticos sin errores conocidos.
5. No declarar “versión máxima final” mientras exista un hallazgo crítico/alto o un error funcional reproducible. Hallazgos moderados deben corregirse o documentarse con justificación técnica explícita antes de aprobar.
6. Solo pedir autorización al usuario cuando exista una acción destructiva, irreversible, con costo, cambio de credenciales/cuenta, publicación live o una decisión de negocio que no pueda inferirse de forma segura.
7. Toda entrega final debe indicar qué se probó, qué pasó y qué queda pendiente por depender de sistemas externos.

## Estándar de producción
Este servicio no se considera listo para producción mientras exista un bloqueo crítico de seguridad, datos, resiliencia, escalabilidad o recuperación.

## Controles obligatorios
- Nunca subir `.env`, tokens, claves ni credenciales al repositorio.
- Usar 2FA en GitHub, Meta y Railway.
- Usar permisos mínimos en Meta y en integraciones externas.
- Validar `X-Hub-Signature-256` con `META_APP_SECRET` en cada POST de Meta.
- La API interna requiere Bearer token aleatorio de al menos 32 caracteres.
- La verificación del webhook usa un token aleatorio de al menos 32 caracteres.
- PostgreSQL debe permanecer en red privada; no exponerlo públicamente.
- TLS obligatorio en tráfico externo y conexiones administradas.
- `STORE_MESSAGE_CONTENT=false` por defecto.
- CORS es fail-closed: un navegador solo puede llamar `/api` desde orígenes incluidos en `ALLOWED_ORIGINS`; requests server-to-server sin `Origin` siguen permitidas.
- `/api` y `/webhook` tienen límites de solicitudes separados.
- El body JSON se limita para reducir abuso de memoria.
- Logs redactan credenciales, teléfonos, identificadores de WhatsApp y destinos/orígenes sensibles.
- Los errores de `/health` no exponen mensajes internos de PostgreSQL.
- La entrada del API se valida con esquemas estrictos.

## Fiabilidad de webhooks
- El webhook se persiste en PostgreSQL antes de responder 200 a Meta.
- Los mensajes entrantes se procesan desde una cola durable con reintentos y backoff.
- `wa_message_id` es único para deduplicación.
- Los trabajos fallidos de la cola se purgan después de 24 horas para minimizar datos.
- Los procesos programados usan leases en PostgreSQL para evitar ejecución duplicada entre réplicas.

## Base de datos y despliegue
- Toda modificación de esquema debe estar versionada en `prisma/migrations`.
- Railway ejecuta `npm run prisma:migrate` antes del despliegue.
- Nunca usar `prisma db push` como mecanismo normal de producción.
- Las migraciones aplicadas son inmutables; una migración ya aplicada no debe editarse.
- El build debe usar `npm ci` y Node.js 22 soportado.

## Datos almacenados
Se guardan datos estructurados necesarios para calificar y operar el lead. El contenido completo de conversación no se almacena de forma permanente salvo que `STORE_MESSAGE_CONTENT=true` se active de forma explícita. La cola entrante puede contener temporalmente el payload necesario para reintentos y se elimina al procesarse correctamente.

## Retención
- Mensajes de conversación: `MESSAGE_RETENTION_DAYS`.
- IDs procesados para deduplicación: `PROCESSED_MESSAGE_RETENTION_DAYS`.
- Payloads de entradas fallidas: máximo 24 h después de entrar en estado terminal.

## Dependencias y CI
- GitHub Actions valida Prisma, tipos, build y `npm audit --audit-level=moderate`.
- Dependabot revisa dependencias semanalmente.
- Un hallazgo moderado o superior debe revisarse antes de aprobar versión máxima.

## Backups y recuperación
Antes de producción live se debe verificar:
- backup automático habilitado para PostgreSQL;
- política de retención conocida;
- restauración probada;
- procedimiento de recuperación documentado;
- ninguna restauración expone secretos o datos a entornos no autorizados.

## Antes de conectar el número real
1. CI aprobado sin vulnerabilidades moderadas o superiores sin aceptar explícitamente.
2. Migraciones aplicadas y healthcheck correcto.
3. Pruebas ES/EN completas para renta, compra y seguros.
4. Handoff humano, reinicio, abandono y entradas inválidas probados.
5. Requests sin firma rechazados.
6. API sin Bearer token rechazada.
7. `STORE_MESSAGE_CONTENT=false` confirmado.
8. Backup y restauración confirmados.
9. Meta probado primero con número de prueba.
10. Solo entonces cambiar `WHATSAPP_MODE=mock` a `live` y cargar secretos directamente en Railway.
