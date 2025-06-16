'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Select,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { createClient } from '@/utils/supabase/client';

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

      // Create new user with email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: values.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (authError) {
        // Check if error is because user already exists
        if (authError.message.toLowerCase().includes('email already registered')) {
          toast.error('An account with this email already exists. Please login instead.');
          router.push('/login');
          return;
        }
        throw authError;
      }

      if (!authData.user) throw new Error('No user data returned');

      // If admin, create the school
      if (values.role === 'admin' && values.schoolName) {
        const { error: schoolError } = await supabase.from('schools').insert({
          name: values.schoolName,
          user_id: authData.user.id,
          is_setup_complete: false,
        });
        if (schoolError) throw schoolError;
      }

      toast.success('Account created! Please check your email to confirm your account.');
      router.push('/login');

    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
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
          <TextInput
            label="Email"
            placeholder="you@example.com"
            {...form.getInputProps('email')}
          />

          <PasswordInput
            label="Password"
            placeholder="Your password"
            mt="md"
            {...form.getInputProps('password')}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />

          <Select
            label="Role"
            mt="md"
            data={[
              { value: 'admin', label: 'School Administrator' },
              { value: 'teacher', label: 'Teacher' },
            ]}
            {...form.getInputProps('role')}
          />

          {form.values.role === 'admin' && (
            <TextInput
              label="School Name"
              placeholder="Enter your school's name"
              mt="md"
              {...form.getInputProps('schoolName')}
            />
          )}

          <Button type="submit" fullWidth mt="xl" loading={isLoading}>
            Sign up
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
