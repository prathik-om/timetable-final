import { createClient } from '@/utils/supabase/server';
import ClassSectionsSetup from './_components/ClassSectionsSetup';

export const dynamic = 'force-dynamic';

export default async function ClassSectionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch school data
  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!school) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Setup Error</h1>
        <p>Please complete the school profile setup first.</p>
      </div>
    );
  }

  // Fetch existing class sections if any
  const { data: classSections } = await supabase
    .from('class_sections')
    .select('*')
    .eq('school_id', school.id)
    .order('grade_level', { ascending: true });

  // Transform class sections to ensure all required fields are present
  const transformedSections = (classSections || []).map(section => ({
    id: section.id,
    name: section.name,
    grade_level: section.grade_level,
    student_count: section.student_count || 0  // Provide default value of 0 for null values
  }));

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">School Setup (5/5): Class Sections</h1>
      <ClassSectionsSetup 
        initialSections={transformedSections} 
        schoolId={school.id}
        userId={user.id}
      />
    </div>
  );
}
