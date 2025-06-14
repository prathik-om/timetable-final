'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Modal,
  TextInput,
  Group,
  ActionIcon,
  rem,
  Card,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database';

// Define the shape of a teacher based on your database schema
type Teacher = Database['public']['Tables']['teachers']['Row'];

// Define the shape of the form data
type TeacherFormData = Omit<Teacher, 'id' | 'created_at' | 'school_id'>;

// Define the props for the component
type TeachersClientUIProps = {
  initialTeachers: Teacher[];
  schoolId: string;
};

export default function TeachersClientUI({
  initialTeachers,
  schoolId,
}: TeachersClientUIProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Hooks for controlling modals
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  // Form hook for create/edit functionality
  const form = useForm<TeacherFormData>({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
    },
    validate: {
      first_name: (value) =>
        value.trim().length > 0 ? null : 'First name is required',
      last_name: (value) =>
        value.trim().length > 0 ? null : 'Last name is required',
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
    if (!selectedTeacher) return;

    toast.promise(
      async () => {
        const { error } = await supabase
          .from('teachers')
          .delete()
          .match({ id: selectedTeacher.id });
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
    const teacherData = { ...values, school_id: schoolId };

    const promise = selectedTeacher
      ? supabase
          .from('teachers')
          .update(teacherData)
          .match({ id: selectedTeacher.id })
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
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => handleEdit(teacher)}
          >
            <IconPencil style={{ width: rem(16), height: rem(16) }} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDelete(teacher)}
          >
            <IconTrash style={{ width: rem(16), height: rem(16) }} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Card shadow="sm" withBorder>
        <Group justify="flex-end" mb="md">
          <Button onClick={handleAdd}>Add New Teacher</Button>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text c="dimmed" ta="center">
                    No teachers found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              required
              label="First Name"
              placeholder="John"
              {...form.getInputProps('first_name')}
            />
            <TextInput
              required
              label="Last Name"
              placeholder="Doe"
              {...form.getInputProps('last_name')}
            />
            <TextInput
              required
              label="Email"
              placeholder="john.doe@example.com"
              {...form.getInputProps('email')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedTeacher ? 'Update Teacher' : 'Create Teacher'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirm Deletion"
        centered
      >
        <Text>
          Are you sure you want to delete {selectedTeacher?.first_name}{' '}
          {selectedTeacher?.last_name}? This action cannot be undone.
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>
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