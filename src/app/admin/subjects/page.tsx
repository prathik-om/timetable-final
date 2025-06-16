import { Text, Title } from '@mantine/core';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import SubjectsClientUI from './_components/SubjectsClientUI';

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
  const supabase = await createClient();

  // Ensure user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // Get the user's school
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (schoolError || !school) {
    redirect('/admin/school-profile');
  }

  // Fetch subjects for this school
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('*')
    .eq('school_id', school.id)
    .order('name', { ascending: true });

  if (subjectsError) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>Failed to load subjects. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Title order={1} className="text-3xl font-bold tracking-tight">
          Manage Subjects
        </Title>
        <Text c="dimmed" mt="xs">
          Define all subjects taught at the school.
        </Text>
      </div>
      <SubjectsClientUI initialSubjects={subjects || []} schoolId={school.id} />
    </div>
  );
}
