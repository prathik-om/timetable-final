'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Anchor, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { toast } from 'sonner';

type SignupForm = {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'teacher';
  schoolName?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupForm>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'admin',
      schoolName: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords did not match' : null,
      schoolName: (value, values) =>
        values.role === 'admin' && (!value || value.length < 2) ? 'School name is required' : null,
    },
  });

  const handleSubmit = async (values: SignupForm) => {
    try {
      setIsLoading(true);

      // 1. Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: values.role,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data returned');

      // 2. If admin, create the school
      if (values.role === 'admin' && values.schoolName) {
        const { error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: values.schoolName,
            user_id: authData.user.id,
          });

        if (schoolError) throw schoolError;
      }

      toast.success('Account created successfully! Please check your email for verification.');
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" fw={900}>
        Create an account
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Already have an account?{' '}
        <Anchor size="sm" component="button" onClick={() => router.push('/login')}>
          Sign in
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              {...form.getInputProps('confirmPassword')}
            />
            <Select
              label="Role"
              placeholder="Select your role"
              data={[
                { value: 'admin', label: 'School Administrator' },
                { value: 'teacher', label: 'Teacher' },
              ]}
              required
              {...form.getInputProps('role')}
            />
            {form.values.role === 'admin' && (
              <TextInput
                label="School Name"
                placeholder="Enter your school name"
                required
                {...form.getInputProps('schoolName')}
              />
            )}
            <Button fullWidth mt="xl" type="submit" loading={isLoading}>
              Create account
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 