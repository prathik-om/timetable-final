'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Card, Container, TextInput, Stack, Text, Group, ActionIcon } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { createClient } from '@/utils/supabase/client';
import { IconTrash, IconPlus } from '@tabler/icons-react';

type Term = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

type AcademicYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  school_id: string;
};

type Props = {
  initialTerms: Term[];
  academicYear: AcademicYear;
  userId: string;
};

export default function TermsSetup({ initialTerms, academicYear, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm({
    initialValues: {
      terms: initialTerms.length > 0
        ? initialTerms.map(term => ({
            name: term.name,
            start_date: new Date(term.start_date),
            end_date: new Date(term.end_date),
            id: term.id
          }))
        : [
            {
              name: 'Term 1',
              start_date: new Date(academicYear.start_date),
              end_date: null,
              id: ''
            }
          ],
    },
    validate: {
      terms: {
        name: (value) => (!value ? 'Name is required' : null),
        start_date: (value) => (!value ? 'Start date is required' : null),
        end_date: (value, values, path) => {
          if (!value) return 'End date is required';
          const termIndex = parseInt(path.split('.')[1]);
          const start = values.terms[termIndex].start_date;
          if (start && value < start) {
            return 'End date must be after start date';
          }
          // Check if this term overlaps with other terms
          const otherTerms = values.terms.filter((_, index) => index !== termIndex);
          for (const otherTerm of otherTerms) {
            if (
              otherTerm.start_date &&
              otherTerm.end_date &&
              ((value >= otherTerm.start_date && value <= otherTerm.end_date) ||
                (start >= otherTerm.start_date && start <= otherTerm.end_date))
            ) {
              return 'Terms cannot overlap';
            }
          }
          return null;
        },
      },
    },
  });

  const addTerm = () => {
    const lastTerm = form.values.terms[form.values.terms.length - 1];
    const newStartDate = lastTerm.end_date 
      ? new Date(lastTerm.end_date)
      : new Date(academicYear.start_date);
    
    form.insertListItem('terms', {
      name: `Term ${form.values.terms.length + 1}`,
      start_date: newStartDate,
      end_date: null,
      id: ''
    });
  };

  const removeTerm = (index: number) => {
    form.removeListItem('terms', index);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // Insert or update terms
      for (const term of values.terms) {
        const termData = {
          name: term.name,
          start_date: term.start_date.toISOString().split('T')[0],
          end_date: term.end_date.toISOString().split('T')[0],
          academic_year_id: academicYear.id,
          school_id: academicYear.school_id,
          user_id: userId,
        };

        if (term.id) {
          // Update existing term
          const { error } = await supabase
            .from('terms')
            .update(termData)
            .eq('id', term.id);

          if (error) throw error;
        } else {
          // Create new term
          const { error } = await supabase
            .from('terms')
            .insert([termData]);

          if (error) throw error;
        }
      }

      // Delete removed terms
      const currentTermIds = values.terms.map(t => t.id).filter(Boolean);
      const initialTermIds = initialTerms.map(t => t.id);
      const removedTermIds = initialTermIds.filter(id => !currentTermIds.includes(id));

      if (removedTermIds.length > 0) {
        const { error } = await supabase
          .from('terms')
          .delete()
          .in('id', removedTermIds);

        if (error) throw error;
      }

      toast.success('Terms saved successfully!');
      router.push('/admin/setup/class-sections'); // Navigate to next setup step
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save terms');
    }
  };

  return (
    <Container size="md">
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Stack>
          <Text size="sm" c="dimmed">
            Create terms for the academic year {academicYear.name}. Terms must not overlap and should cover your academic calendar.
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {form.values.terms.map((term, index) => (
                <Card key={index} withBorder shadow="sm" p="md" radius="md">
                  <Group align="flex-start">
                    <Stack style={{ flex: 1 }}>
                      <TextInput
                        label="Term Name"
                        placeholder="e.g., Term 1"
                        {...form.getInputProps(`terms.${index}.name`)}
                      />
                      
                      <Group grow>
                        <DateInput
                          label="Start Date"
                          placeholder="Select start date"
                          minDate={new Date(academicYear.start_date)}
                          maxDate={new Date(academicYear.end_date)}
                          {...form.getInputProps(`terms.${index}.start_date`)}
                        />

                        <DateInput
                          label="End Date"
                          placeholder="Select end date"
                          minDate={form.values.terms[index].start_date || undefined}
                          maxDate={new Date(academicYear.end_date)}
                          {...form.getInputProps(`terms.${index}.end_date`)}
                        />
                      </Group>
                    </Stack>

                    {form.values.terms.length > 1 && (
                      <ActionIcon 
                        color="red" 
                        onClick={() => removeTerm(index)}
                        variant="subtle"
                        size="lg"
                        mt={24}
                      >
                        <IconTrash size={20} />
                      </ActionIcon>
                    )}
                  </Group>
                </Card>
              ))}

              <Group justify="space-between">
                <Button 
                  variant="light" 
                  onClick={addTerm}
                  leftSection={<IconPlus size={20} />}
                >
                  Add Term
                </Button>

                <Button type="submit">
                  Save & Continue
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Container>
  );
}
