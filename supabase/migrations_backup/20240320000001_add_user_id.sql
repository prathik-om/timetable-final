-- Add user_id column to schools table
ALTER TABLE schools ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add RLS policies
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own school
CREATE POLICY "Users can view their own school"
    ON schools FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own school
CREATE POLICY "Users can insert their own school"
    ON schools FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own school
CREATE POLICY "Users can update their own school"
    ON schools FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own school
CREATE POLICY "Users can delete their own school"
    ON schools FOR DELETE
    USING (auth.uid() = user_id); 