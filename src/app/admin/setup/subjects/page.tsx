import { createClient } from '@/utils/supabase/server';
import SubjectsSetup from './_components/SubjectsSetup';

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
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

  // Fetch existing subjects if any
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('school_id', school.id)
    .order('name', { ascending: true });

  // Transform subjects to ensure all required fields are present
  const transformedSubjects = (subjects || []).map((subject) => ({
    id: subject.id,
    name: subject.name,
    code: subject.code || '', // Provide default empty string for null values
    school_id: subject.school_id,
    subject_type: subject.subject_type || '', // Provide default empty string for null values
  }));

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">School Setup (4/5): Subjects</h1>
      <SubjectsSetup
        initialSubjects={transformedSubjects}
        schoolId={school.id}
        userId={user.id}
      />
    </div>
  );
}
