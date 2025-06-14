-- Add unique constraint to ensure one teacher per class offering
ALTER TABLE teaching_assignments
ADD CONSTRAINT teaching_assignments_class_offering_id_unique UNIQUE (class_offering_id);

-- Drop the existing composite unique constraint if it exists
ALTER TABLE teaching_assignments
DROP CONSTRAINT IF EXISTS teaching_assignments_class_offering_id_teacher_id_key; 