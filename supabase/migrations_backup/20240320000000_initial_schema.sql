-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before creating
DROP POLICY IF EXISTS "Users can view their own school" ON schools;
DROP POLICY IF EXISTS "Users can insert their own school" ON schools;
DROP POLICY IF EXISTS "Users can update their own school" ON schools;
DROP POLICY IF EXISTS "Users can delete their own school" ON schools;

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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 