import { Text, Title } from '@mantine/core';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import TeachersClientUI from './_components/TeachersClientUI';

export const dynamic = 'force-dynamic';

// This is a React Server Component. It can be async and fetch data directly.
export default async function TeachersPage() {
  const supabase = await createClient();

  // Ensure user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // 1. Data fetching happens securely on the server before the page is sent.
  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user.id)
    .order('last_name', { ascending: true });

  // Also fetch the school ID to associate teachers with.
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (teachersError || schoolError) {
    // In a real app, you'd render a more user-friendly error component here.
    const errorMessage = teachersError?.message || schoolError?.message || 'Could not load data.';
    return <div className="p-8">Error: {errorMessage}</div>;
  }
  if (!school) {
    return <div className="p-8">No school found. Please create a school profile first.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Title order={1} className="text-3xl font-bold tracking-tight">
          Manage Teachers
        </Title>
        <Text c="dimmed" mt="xs">
          Add, edit, or remove teacher profiles from the system.
        </Text>
      </div>

      {/* 2. We render the Client Component, passing the initial data to it. */}
      <TeachersClientUI initialTeachers={teachers || []} schoolId={school.id} />
    </div>
  );
}
