import { createClient } from '@/utils/supabase/server';
import TermsSetup from './_components/TermsSetup';

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch academic year data first
  const { data: academicYear } = await supabase
    .from('academic_years')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!academicYear) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Setup Error</h1>
        <p>Please complete the academic year setup first.</p>
      </div>
    );
  }

  // Fetch existing terms if any
  const { data: terms } = await supabase
    .from('terms')
    .select('*')
    .eq('academic_year_id', academicYear.id)
    .order('start_date', { ascending: true });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">School Setup (3/5): Terms</h1>
      <TermsSetup 
        initialTerms={terms || []} 
        academicYear={academicYear}
        userId={user.id} 
      />
    </div>
  );
}
