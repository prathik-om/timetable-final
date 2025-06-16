import { Text, Title } from '@mantine/core';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ClassSectionsClientUI from './_components/ClassSectionsClientUI';

export const dynamic = 'force-dynamic';

export default async function ClassSectionsPage() {
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

  // Fetch class sections for this school
  const { data: classSections, error: sectionsError } = await supabase
    .from('class_sections')
    .select('*')
    .eq('school_id', school.id)
    .order('grade_level', { ascending: true });

  if (sectionsError) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>Failed to load class sections. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Title order={1} className="text-3xl font-bold tracking-tight">
          Manage Class Sections
        </Title>
        <Text c="dimmed" mt="xs">
          Define all class sections in the school.
        </Text>
      </div>
      <ClassSectionsClientUI initialClassSections={classSections || []} schoolId={school.id} />
    </div>
  );
}
