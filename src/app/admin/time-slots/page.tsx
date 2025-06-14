import { createClient } from '@/utils/supabase/server';
import TimeSlotsClientUI from './_components/TimeSlotsClientUI';
import { Title, Text } from '@mantine/core';
import { cookies } from 'next/headers';

export default async function TimeSlotsPage() {
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

  // Fetch all time slots for the school, ordered by day and then start time
  const { data: timeSlots, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('school_id', schoolId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    return <div className="p-8">Error: Could not load time slot data. ({error.message})</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
          <Title order={1} className="text-3xl font-bold tracking-tight">Manage Weekly Time Slots</Title>
          <Text c="dimmed" mt="xs">Define the weekly template of periods, breaks, and lunches.</Text>
      </div>

      <TimeSlotsClientUI 
        initialTimeSlots={timeSlots || []}
        schoolId={schoolId}
      />
    </div>
  );
} 