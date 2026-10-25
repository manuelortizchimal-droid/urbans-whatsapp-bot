# Captación de propietarios — implementación aislada
Rama: feature/owner-prospecting-mvp. No modifica la mensajería actual.

## Archivos
- `owner-prospecting/prospects.sample.json`: tres anuncios de prueba, sin teléfonos.
- `owner-prospecting/schema.sql`: tabla PostgreSQL con unicidad y control de consentimiento.
- `owner-prospecting/prospect.ts`: validación, huella para duplicados y scoring determinista.

## Pendientes antes de producción
1. Ejecutar migración en entorno privado con respaldo.
2. Montar endpoints autenticados, con permisos y auditoría; NO exponerlos públicamente.
3. Implementar importación de capturas y revisión humana.
4. Validar fingerprint con datos reales; mismo inmueble puede tener varios anuncios.
5. Conectar WhatsApp Coexistence únicamente tras confirmar elegibilidad.
6. Registrar opt-in verificable y aprobación de plantillas antes de cualquier envío proactivo.
7. Ejecutar QA en entorno con Node, base de datos y credenciales de prueba.
La puntuación de ejemplo de las capturas es provisional y no se recalcula automáticamente.
