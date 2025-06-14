import { createClient } from '@/utils/supabase/server';
import SubjectsClientUI from './_components/SubjectsClientUI';
import { Title, Text } from '@mantine/core';

export default async function SubjectsPage() {
  const supabase = await createClient();

  // Fetch the first school (or use your own logic to get the correct school)
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .limit(1)
    .single();

  if (schoolError || !school) {
    return <div className="p-8">Error: Could not load school information.</div>;
  }

  // Fetch subjects for this school
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('school_id', school.id)
    .order('name', { ascending: true });

  if (error) {
    return <div className="p-8">Error: Could not load subject data.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Title order={1} className="text-3xl font-bold tracking-tight">Manage Subjects</Title>
        <Text c="dimmed" mt="xs">Define all subjects taught at the school.</Text>
      </div>
      <SubjectsClientUI initialSubjects={subjects || []} schoolId={school.id} />
    </div>
  );
}