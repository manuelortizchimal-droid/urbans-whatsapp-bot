# URBANS — captación de propietarios

## Qué está implementado
- Modelo `OwnerProspect` en Prisma y migración PostgreSQL versionada.
- API autenticada mediante el middleware `requireInternalApiKey` existente:
  - `POST /api/owner-prospects`
  - `GET /api/owner-prospects?stage=identified&limit=50`
  - `PATCH /api/owner-prospects/:id`
- Validación Zod, huella SHA-256 para duplicados y score orientativo.
- Control de consentimiento: evidencia y fecha obligatorias para activarlo.
- Dashboard local de demostración en `demo/index.html`, con tres ejemplos públicos sin teléfonos.

## Para probar el panel ahora
Abre `owner-prospecting/demo/index.html` desde el repositorio descargado. Funciona sin servidor; guarda solo datos no sensibles en localStorage del navegador. No comparte datos entre equipos ni se conecta a la API.

## Instalación del backend (cuando haya hosting y PostgreSQL)
```bash
npm ci
npx prisma validate
npx prisma migrate deploy
npm run build
npx tsx --test owner-prospecting/prospect.test.ts
```
Requiere `DATABASE_URL`, `INTERNAL_API_KEY`, `WHATSAPP_VERIFY_TOKEN` y `WHATSAPP_MODE=mock` para pruebas. No copiar credenciales a GitHub ni al navegador. El archivo `schema.sql` es solo un boceto inicial: **no ejecutarlo junto con Prisma**.

## Seguridad y pendientes
- No hay scraping de Marketplace ni envío automático a anunciantes.
- No existe aún interfaz multiusuario autenticada conectada al backend.
- Antes de producción: revisar permisos por usuario, registrar auditoría, hacer backup, probar migraciones y endpoints, y validar consentimiento conforme a las políticas de WhatsApp.
- Para WhatsApp Coexistence: falta habilitación real del número y proveedor; no migrar el número sin confirmar preservación de la aplicación móvil.
- Los scores de ejemplos son estimaciones manuales, no resultados de IA.
