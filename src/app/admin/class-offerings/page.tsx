import { createClient } from '@/utils/supabase/server';
import ClassOfferingsClientUI from './_components/ClassOfferingsClientUI';
import { Title, Text } from '@mantine/core';
import { cookies } from 'next/headers';

export default async function ClassOfferingsPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .limit(1)
    .single();

  if (schoolError || !school) {
    return <div className="p-8">Error: No school found. Please create a school profile first.</div>;
  }
  
  const schoolId = school.id;

  // Fetch all required data in parallel
  const [
    { data: terms, error: termsError },
    { data: classSections, error: classSectionsError },
    { data: subjects, error: subjectsError },
    { data: classOfferings, error: classOfferingsError }
  ] = await Promise.all([
    supabase.from('terms').select('*').order('name'),
    supabase.from('class_sections').select('*').eq('school_id', schoolId).order('name'),
    supabase.from('subjects').select('*').eq('school_id', schoolId).order('name'),
    supabase.from('class_offerings').select('*')
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
        <Title order={1} className="text-3xl font-bold tracking-tight">Manage Class Offerings</Title>
        <Text c="dimmed" mt="xs">Define which subjects are taught to which class sections in each term.</Text>
      </div>

      <ClassOfferingsClientUI 
        initialOfferings={classOfferings || []}
        terms={terms || []}
        classSections={classSections || []}
        subjects={subjects || []}
        schoolId={schoolId}
      />
    </div>
  );
} 