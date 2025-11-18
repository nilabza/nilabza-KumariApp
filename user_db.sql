
-- =========================================
-- Database: communication_app_db
-- =========================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- Table 1: users
-- =========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA256 hash of phone number
    first_call_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_call_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    age_range VARCHAR(10),
    district VARCHAR(100),
    village VARCHAR(100),
    total_calls INTEGER NOT NULL DEFAULT 1
);

-- =========================================
-- Table 2: calls
-- =========================================
CREATE TABLE IF NOT EXISTS calls (
    call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    call_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    call_end TIMESTAMPTZ,
    duration_seconds INTEGER,
    mode VARCHAR(10) CHECK (mode IN ('text', 'speech')),
    language VARCHAR(30) DEFAULT 'en',
    transcript_available BOOLEAN DEFAULT FALSE,
    audio_url TEXT,
    transcription TEXT,
    summary TEXT,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- Table 3: messages
-- =========================================
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(call_id) ON DELETE CASCADE,
    sender VARCHAR(10) CHECK (sender IN ('user', 'assistant')),
    message_text TEXT,
    audio_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- Table 4: speech_metadata
-- =========================================
CREATE TABLE IF NOT EXISTS speech_metadata (
    speech_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
    duration_seconds INTEGER,
    speech_language VARCHAR(30),
    transcription_confidence NUMERIC(5,2),
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- End of Schema
-- =========================================
