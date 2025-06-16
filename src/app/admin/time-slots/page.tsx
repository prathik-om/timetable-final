import { Text, Title } from '@mantine/core';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import TimeSlotsClientUI from './_components/TimeSlotsClientUI';

export const dynamic = 'force-dynamic';

export default async function TimeSlotsPage() {
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
  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!school) {
    redirect('/admin/school-profile');
  }

  // Fetch existing time slots
  const { data: timeSlots } = await supabase
    .from('time_slots')
    .select('*')
    .eq('school_id', school.id)
    .order('start_time');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Title order={1} className="text-3xl font-bold tracking-tight">
          Manage Weekly Time Slots
        </Title>
        <Text c="dimmed" mt="xs">
          Define the weekly template of periods, breaks, and lunches.
        </Text>
      </div>

      <TimeSlotsClientUI initialTimeSlots={timeSlots || []} schoolId={school.id} />
    </div>
  );
}
