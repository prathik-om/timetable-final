-- Add missing fields to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS board_affiliation text,
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS is_setup_complete boolean NOT NULL DEFAULT FALSE;

-- Update types to match
DROP TYPE IF EXISTS setup_status_enum CASCADE;
CREATE TYPE setup_status_enum AS ENUM ('not_started', 'in_progress', 'completed');
