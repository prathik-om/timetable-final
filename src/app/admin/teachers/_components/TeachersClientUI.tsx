'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  rem,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { Database } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';

// Define the shape of a teacher based on your database schema
type Teacher = Database['public']['Tables']['teachers']['Row'];

// Define the shape of the form data
type TeacherFormData = Omit<Teacher, 'id' | 'created_at' | 'school_id'>;

// Define the props for the component
type TeachersClientUIProps = {
  initialTeachers: Teacher[];
  schoolId: string;
};

export default function TeachersClientUI({ initialTeachers, schoolId }: TeachersClientUIProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Hooks for controlling modals
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);

  // Check for user session on mount
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
    };
    checkUser();
  }, []);

  // Form hook for create/edit functionality
  const form = useForm<TeacherFormData>({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
    },
    validate: {
      first_name: (value) => (value.trim().length > 0 ? null : 'First name is required'),
      last_name: (value) => (value.trim().length > 0 ? null : 'Last name is required'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  // Handler to open the modal for adding a new teacher
  const handleAdd = () => {
    setSelectedTeacher(null);
    form.reset();
    openModal();
  };

  // Handler to open the modal for editing an existing teacher
  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    form.setValues({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
    });
    openModal();
  };

  // Handler to open the delete confirmation modal
  const handleDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    openDeleteModal();
  };

  // Handler to confirm and execute the delete operation
  const confirmDelete = async () => {
    if (!selectedTeacher || !user) return;

    toast.promise(
      async () => {
        const { error } = await supabase
          .from('teachers')
          .delete()
          .match({ id: selectedTeacher.id, user_id: user.id });
        if (error) throw new Error(error.message);
        closeDeleteModal();
        router.refresh(); // Refresh server-side data
      },
      {
        loading: 'Deleting teacher...',
        success: 'Teacher deleted successfully!',
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  // Handler for form submission (create or update)
  const handleSubmit = async (values: TeacherFormData) => {
    if (!user) return;

    const teacherData = { ...values, school_id: schoolId, user_id: user.id };

    const promise = selectedTeacher
      ? supabase.from('teachers').update(teacherData).match({ id: selectedTeacher.id, user_id: user.id })
      : supabase.from('teachers').insert(teacherData);

    toast.promise(
      async () => {
        const { error } = await promise;
        if (error) throw new Error(error.message);
        closeModal();
        router.refresh(); // Refresh server-side data
      },
      {
        loading: selectedTeacher ? 'Updating teacher...' : 'Creating teacher...',
        success: selectedTeacher
          ? 'Teacher updated successfully!'
          : 'Teacher created successfully!',
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  // Map teacher data to table rows
  const rows = initialTeachers.map((teacher) => (
    <Table.Tr key={teacher.id}>
      <Table.Td>{`${teacher.first_name} ${teacher.last_name}`}</Table.Td>
      <Table.Td>{teacher.email}</Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(teacher)}>
            <IconPencil style={{ width: rem(16), height: rem(16) }} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(teacher)}>
            <IconTrash style={{ width: rem(16), height: rem(16) }} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Card shadow="sm" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500}>Teachers</Text>
          <Button onClick={handleAdd}>Add New Teacher</Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th style={{ width: rem(100) }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={3} style={{ textAlign: 'center' }}>
                  No teachers found
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={modalOpened} onClose={closeModal} title={selectedTeacher ? 'Edit Teacher' : 'Add Teacher'}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="First Name"
              placeholder="Enter first name"
              required
              {...form.getInputProps('first_name')}
            />
            <TextInput
              label="Last Name"
              placeholder="Enter last name"
              required
              {...form.getInputProps('last_name')}
            />
            <TextInput
              label="Email"
              placeholder="Enter email"
              required
              {...form.getInputProps('email')}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">{selectedTeacher ? 'Update' : 'Create'}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirm Delete"
        centered
      >
        <Text size="sm">Are you sure you want to delete this teacher?</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}
