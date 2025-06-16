import { Container, Text } from '@mantine/core';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { TimeslotsClientComponent } from './TimeslotsClient';

export const dynamic = 'force-dynamic';

export default async function TimeslotsPage() {
  const supabase = await createClient();

  // Ensure user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
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
    return (
      <Container>
        <Text color="red">Error: Could not find a school in the database.</Text>
      </Container>
    );
  }

  // Fetch timeslots for this school
  const { data: time_slots, error: slotsError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('school_id', school.id)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (slotsError) {
    console.error('Error fetching time slots:', slotsError);
    return (
      <Container>
        <Text color="red">Failed to load time slots. Please try again later.</Text>
      </Container>
    );
  }

  // Transform the data to match the expected types
  const transformedSlots = (time_slots || []).map(slot => ({
    ...slot,
    id: parseInt(slot.id), // Convert string id to number
    is_teaching_period: slot.is_teaching_period || false, // Provide default value
    slot_name: slot.slot_name || '' // Provide default value
  }));

  return <TimeslotsClientComponent initialTimeslots={transformedSlots} schoolId={school.id} />;
}
