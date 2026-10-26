-- URBANS Owner Prospecting MVP. Run in private PostgreSQL after review.
CREATE TABLE IF NOT EXISTS owner_prospects (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 source TEXT NOT NULL CHECK (source IN ('facebook_group','marketplace','facebook_ad','manual')),
 source_url TEXT,
 advertiser_name TEXT NOT NULL,
 property_type TEXT NOT NULL,
 location TEXT,
 address TEXT,
 price_mxn NUMERIC(12,2),
 details TEXT,
 phone TEXT,
 owner_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
 score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100),
 stage TEXT NOT NULL DEFAULT 'identified' CHECK(stage IN ('identified','pending','contactable','contacted','interested','negotiation','captured','discarded')),
 contact_consent BOOLEAN NOT NULL DEFAULT FALSE,
 consent_evidence TEXT,
 consent_at TIMESTAMPTZ,
 contact_status TEXT NOT NULL DEFAULT 'not_authorized',
 fingerprint TEXT NOT NULL UNIQUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT consent_evidence_required CHECK (NOT contact_consent OR (consent_evidence IS NOT NULL AND consent_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS owner_prospects_stage_idx ON owner_prospects(stage);
CREATE INDEX IF NOT EXISTS owner_prospects_score_idx ON owner_prospects(score DESC);
-- No unsolicited messaging job or bulk scraper is installed.
