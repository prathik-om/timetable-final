-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add school_id to teaching_assignments if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'teaching_assignments' 
        AND column_name = 'school_id'
    ) THEN
        ALTER TABLE teaching_assignments ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;

    -- Add school_id to class_offerings if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'class_offerings' 
        AND column_name = 'school_id'
    ) THEN
        ALTER TABLE class_offerings ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;

    -- Add school_id to teacher_qualifications if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'teacher_qualifications' 
        AND column_name = 'school_id'
    ) THEN
        ALTER TABLE teacher_qualifications ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update existing records to use the first school
UPDATE teaching_assignments ta
SET school_id = (SELECT id FROM schools LIMIT 1)
WHERE school_id IS NULL;

UPDATE class_offerings co
SET school_id = (SELECT id FROM schools LIMIT 1)
WHERE school_id IS NULL;

UPDATE teacher_qualifications tq
SET school_id = (SELECT id FROM schools LIMIT 1)
WHERE school_id IS NULL;

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
    -- Enable RLS
    ALTER TABLE teaching_assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE class_offerings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_qualifications ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their school's teaching assignments" ON teaching_assignments;
    DROP POLICY IF EXISTS "Users can insert their school's teaching assignments" ON teaching_assignments;
    DROP POLICY IF EXISTS "Users can update their school's teaching assignments" ON teaching_assignments;
    DROP POLICY IF EXISTS "Users can delete their school's teaching assignments" ON teaching_assignments;

    DROP POLICY IF EXISTS "Users can view their school's class offerings" ON class_offerings;
    DROP POLICY IF EXISTS "Users can insert their school's class offerings" ON class_offerings;
    DROP POLICY IF EXISTS "Users can update their school's class offerings" ON class_offerings;
    DROP POLICY IF EXISTS "Users can delete their school's class offerings" ON class_offerings;

    DROP POLICY IF EXISTS "Users can view their school's teacher qualifications" ON teacher_qualifications;
    DROP POLICY IF EXISTS "Users can insert their school's teacher qualifications" ON teacher_qualifications;
    DROP POLICY IF EXISTS "Users can update their school's teacher qualifications" ON teacher_qualifications;
    DROP POLICY IF EXISTS "Users can delete their school's teacher qualifications" ON teacher_qualifications;
END $$;

-- Create new policies
CREATE POLICY "Users can view their school's teaching assignments"
    ON teaching_assignments FOR SELECT
    USING (school_id IN (SELECT id FROM schools));

CREATE POLICY "Users can insert their school's teaching assignments"
    ON teaching_assignments FOR INSERT
    WITH CHECK (school_id IN (SELECT id FROM schools));

CREATE POLICY "Users can update their school's teaching assignments"
    ON teaching_assignments FOR UPDATE
    USING (school_id IN (SELECT id FROM schools))
    WITH CHECK (school_id IN (SELECT id FROM schools));

CREATE POLICY "Users can delete their school's teaching assignments"
    ON teaching_assignments FOR DELETE
    USING (school_id IN (SELECT id FROM schools));

-- Policy for class_offerings
CREATE POLICY "Users can view their school's class offerings"
    ON class_offerings FOR SELECT
    USING (school_id IN (SELECT id FROM schools));

CREATE POLICY "Users can insert their school's class offerings"
    ON class_offerings FOR INSERT
    WITH CHECK (school_id IN (SELECT id FROM schools));

CREATE POLICY "Users can update their school's class offerings"
    ON class_offerings FOR UPDATE
    USING (school_id IN (SELECT id FROM schools))
    WITH CHECK (school_id IN (SELECT id FROM schools));

CREATE POLICY "Users can delete their school's class offerings"
    ON class_offerings FOR DELETE
    USING (school_id IN (SELECT id FROM schools));

-- Policy for teacher_qualifications
CREATE POLICY "Users can view their school's teacher qualifications"
    ON teacher_qualifications FOR SELECT
    USING (school_id IN (SELECT id FROM schools));

CREATE POLICY "Users can insert their school's teacher qualifications"
    ON teacher_qualifications FOR INSERT
    WITH CHECK (school_id IN (SELECT id FROM schools));

CREATE POLICY "Users can update their school's teacher qualifications"
    ON teacher_qualifications FOR UPDATE
    USING (school_id IN (SELECT id FROM schools))
    WITH CHECK (school_id IN (SELECT id FROM schools));

CREATE POLICY "Users can delete their school's teacher qualifications"
    ON teacher_qualifications FOR DELETE
    USING (school_id IN (SELECT id FROM schools)); 