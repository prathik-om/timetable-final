import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import TeacherQualificationsClient from './_components/TeacherQualificationsClient';

export default async function TeacherQualificationsPage() {
  const cookieStore = cookies();
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
  const { data: schoolData, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (schoolError || !schoolData) {
    redirect('/admin/school-profile');
  }

  // Fetch all required data
  const [{ data: teachers }, { data: subjects }, { data: qualifications }] = await Promise.all([
    // Fetch teachers
    supabase.from('teachers').select('*').eq('user_id', user.id),

    // Fetch subjects
    supabase.from('subjects').select('*').eq('user_id', user.id),

    // Fetch teacher qualifications
    supabase.from('teacher_qualifications').select('*').eq('user_id', user.id),
  ]);

  if (!teachers || !subjects || !qualifications) {
    throw new Error('Failed to fetch required data');
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teacher Qualifications</h1>
      <TeacherQualificationsClient
        teachers={teachers}
        subjects={subjects}
        qualifications={qualifications}
        schoolId={schoolData.id}
      />
    </div>
  );
}
