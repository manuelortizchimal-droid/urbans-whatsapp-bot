# URBANS CRM — deployment configuration
# Attach a private PostgreSQL database before deploying.
# Set these as secret environment variables in your hosting provider:
# DATABASE_URL=postgresql://...
# INTERNAL_API_KEY=<random 64+ character secret>
# WHATSAPP_VERIFY_TOKEN=<random 64+ character secret>
# WHATSAPP_MODE=mock (until authorized WhatsApp integration)
# NODE_ENV=production
# STORE_MESSAGE_CONTENT=false
# ALLOWED_ORIGINS=<your trusted dashboard origin>
#
# Build: npm ci && npm run build
# Pre-deploy migration: npx prisma migrate deploy
# Start: npm start
# Healthcheck: /health
#
# IMPORTANT: Never place INTERNAL_API_KEY in browser code or public static files.
# Browser UI must use a server-side authenticated session/BFF proxy.
# Do not publish the demo as a live CRM containing personal data.
