import { createClient } from '@/utils/supabase/server';
import ClassSectionsClientUI from './_components/ClassSectionsClientUI';
import { Title, Text } from '@mantine/core';

export default async function ClassSectionsPage() {
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

  // Fetch class sections for this school
  const { data: classSections, error } = await supabase
    .from('class_sections')
    .select('*')
    .eq('school_id', school.id)
    .order('grade_level', { ascending: true });

  if (error) {
    return <div className="p-8">Error: Could not load class section data.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Title order={1} className="text-3xl font-bold tracking-tight">Manage Class Sections</Title>
        <Text c="dimmed" mt="xs">Define all class sections in the school.</Text>
      </div>
      <ClassSectionsClientUI initialClassSections={classSections || []} schoolId={school.id} />
    </div>
  );
} 