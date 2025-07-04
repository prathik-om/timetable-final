'use client';

import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { Button, Card, Container, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { createClient } from '@/utils/supabase/client';

type School = {
  id: string;
  name: string;
  created_at: string | null;
};

type Props = {
  initialSchool: School | null;
  userId: string;
};

export default function SchoolProfileClient({ initialSchool, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm({
    initialValues: {
      name: initialSchool?.name || '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must have at least 2 letters' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (initialSchool) {
        // Update existing school
        const { error } = await supabase.from('schools').update(values).eq('id', initialSchool.id);

        if (error) throw error;
        toast.success('Profile updated!');
        router.refresh();
      } else {
        // Create new school
        const { error } = await supabase
          .from('schools')
          .insert([{ ...values, user_id: userId }]);

        if (error) {
          console.error('Error creating school:', error);
          throw error;
        }
        toast.success('Profile created!');
        router.push('/admin/setup/academic-year');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    }
  };

  return (
    <Container my="md">
      <Toaster />
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="School Name"
            placeholder="Enter school name"
            {...form.getInputProps('name')}
            mb="md"
          />
          <Button type="submit">{initialSchool ? 'Save Changes' : 'Create Profile'}</Button>
        </form>
      </Card>
    </Container>
  );
}
