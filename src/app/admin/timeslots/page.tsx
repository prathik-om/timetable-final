import { supabase } from '@/lib/supabaseClient';
import { Container, Text } from '@mantine/core';
import { TimeslotsClientComponent } from './TimeslotsClient';

const TimeslotsPage = async () => {
  // First, get the UUID of the school. We'll assume we're working with the first school in the DB.
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .limit(1)
    .single();

  if (schoolError || !school) {
    console.error('Error fetching school:', schoolError);
    return (
      <Container>
        <Text color="red">Error: Could not find a school in the database.</Text>
      </Container>
    );
  }
  const schoolId = school.id;

  const { data: time_slots, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('school_id', schoolId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching time slots:', error);
    // Render an error message or fallback UI
    return (
      <Container>
        <Text color="red">Failed to load time slots. Please try again later.</Text>
      </Container>
    );
  }

  return <TimeslotsClientComponent initialTimeslots={time_slots || []} schoolId={schoolId} />;
};

export default TimeslotsPage; 