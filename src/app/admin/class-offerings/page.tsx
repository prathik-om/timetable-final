import { Text, Title } from '@mantine/core';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ClassOfferingsClientUI from './_components/ClassOfferingsClientUI';

export const dynamic = 'force-dynamic';

export default async function ClassOfferingsPage() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

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

  // Fetch all required data
  const [
    { data: terms, error: termsError },
    { data: classSections, error: classSectionsError },
    { data: subjects, error: subjectsError },
    { data: classOfferings, error: classOfferingsError },
  ] = await Promise.all([
    supabase.from('terms').select('*').eq('school_id', school.id).order('start_date'),
    supabase.from('class_sections').select('*').eq('school_id', school.id).order('name'),
    supabase.from('subjects').select('*').eq('school_id', school.id).order('name'),
    supabase.from('class_offerings').select('*'),
  ]);

  // Check for any errors
  if (termsError || classSectionsError || subjectsError || classOfferingsError) {
    return (
      <div className="p-8">
        Error loading data. Please try again later.
        {termsError && <div>Terms error: {termsError.message}</div>}
        {classSectionsError && <div>Class sections error: {classSectionsError.message}</div>}
        {subjectsError && <div>Subjects error: {subjectsError.message}</div>}
        {classOfferingsError && <div>Class offerings error: {classOfferingsError.message}</div>}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Title order={1} className="text-3xl font-bold tracking-tight">
          Manage Class Offerings
        </Title>
        <Text c="dimmed" mt="xs">
          Define which subjects are taught to which class sections in each term.
        </Text>
      </div>

      <ClassOfferingsClientUI
        initialOfferings={classOfferings || []}
        terms={terms || []}
        classSections={classSections || []}
        subjects={subjects || []}
        schoolId={school.id}
      />
    </div>
  );
}
