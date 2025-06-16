import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';
import AcademicYearSetup from './_components/AcademicYearSetup';

export const dynamic = 'force-dynamic';

export default async function AcademicYearPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (!session || sessionError) {
    redirect('/login');
  }

  // Fetch school data first
  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  if (!school) {
    redirect('/admin/school-profile');
  }

  // Fetch existing academic year if any
  const { data: academicYear } = await supabase
    .from('academic_years')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">School Setup (2/5): Academic Year</h1>
      <AcademicYearSetup initialData={academicYear} userId={session.user.id} />
    </div>
  );
}
