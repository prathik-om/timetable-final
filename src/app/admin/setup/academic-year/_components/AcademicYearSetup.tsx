'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Card, Container, TextInput, Title, Stack, Text, Group } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { createClient } from '@/utils/supabase/client';

type AcademicYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

type Props = {
  initialData: AcademicYear | null;
  userId: string;
};

export default function AcademicYearSetup({ initialData, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm({
    initialValues: {
      name: initialData?.name || '',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : null,
      end_date: initialData?.end_date ? new Date(initialData.end_date) : null,
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      start_date: (value) => (!value ? 'Start date is required' : null),
      end_date: (value, values) => {
        if (!value) return 'End date is required';
        if (values.start_date && value < values.start_date) {
          return 'End date must be after start date';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // Get the school ID first
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!school) {
        throw new Error('School not found');
      }

      const academicYearData = {
        name: values.name,
        start_date: values.start_date?.toISOString().split('T')[0],
        end_date: values.end_date?.toISOString().split('T')[0],
        school_id: school.id,
        user_id: userId,
      };

      if (initialData) {
        // Update existing academic year
        const { error } = await supabase
          .from('academic_years')
          .update(academicYearData)
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success('Academic year updated!');
      } else {
        // Create new academic year
        const { error } = await supabase
          .from('academic_years')
          .insert([academicYearData]);

        if (error) throw error;
        toast.success('Academic year created!');
        router.push('/admin/setup/terms'); // Navigate to next setup step
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save academic year');
    }
  };

  return (
    <Container size="sm">
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Stack>
          <Title order={2}>Academic Year Details</Title>
          <Text c="dimmed" size="sm">
            Set up your academic year to organize terms and schedules.
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Academic Year Name"
                placeholder="e.g., 2025-2026"
                {...form.getInputProps('name')}
              />
              
              <DateInput
                label="Start Date"
                placeholder="Select start date"
                {...form.getInputProps('start_date')}
              />

              <DateInput
                label="End Date"
                placeholder="Select end date"
                {...form.getInputProps('end_date')}
                minDate={form.values.start_date || undefined}
              />

              <Group justify="flex-end" mt="md">
                <Button type="submit">
                  {initialData ? 'Update Academic Year' : 'Create & Continue'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Container>
  );
}
