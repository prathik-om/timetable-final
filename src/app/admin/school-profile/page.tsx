import { redirect } from 'next/navigation';
import SchoolProfileClient from '@/app/admin/school-profile/_components/SchoolProfileClient';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SchoolProfilePage() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Fetch existing school data
  const { data: schoolData } = await supabase
    .from('schools')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">School Setup (1/5): School Profile</h1>
      <SchoolProfileClient initialSchool={schoolData} userId={user.id} />
    </div>
  );
}
