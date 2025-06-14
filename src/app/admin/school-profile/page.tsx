import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SchoolProfileClient from '@/app/admin/school-profile/_components/SchoolProfileClient';

export default async function SchoolProfilePage() {
  const cookieStore = cookies();
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Fetch existing school data
  const { data: schoolData } = await supabase
    .from('schools')
    .select('*')
    .single();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">School Profile</h1>
      <SchoolProfileClient initialSchool={schoolData} userId={user.id} />
    </div>
  );
} 