'use client';

import { useState } from 'react';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  ActionIcon,
  Button,
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

type Teacher = Database['public']['Tables']['teachers']['Row'];

type TeachersClientProps = {
  initialTeachers: Teacher[];
  schoolId: string;
};

export default function TeachersClient({ initialTeachers, schoolId }: TeachersClientProps) {
  const supabase = createClient();
  const [teachers, setTeachers] = useState(initialTeachers);
  const [addEditModalOpened, { open: openAddEditModal, close: closeAddEditModal }] =
    useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const form = useForm({
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

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    form.reset();
    openAddEditModal();
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    form.setValues({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
    });
    openAddEditModal();
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!selectedTeacher) return;

    const { error } = await supabase.from('teachers').delete().match({ id: selectedTeacher.id });

    if (error) {
      toast.error(error.message);
    } else {
      setTeachers(teachers.filter((t) => t.id !== selectedTeacher.id));
      toast.success('Teacher deleted successfully');
    }

    closeDeleteModal();
    setSelectedTeacher(null);
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (selectedTeacher) {
      // Update
      const { data, error } = await supabase
        .from('teachers')
        .update(values)
        .match({ id: selectedTeacher.id })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
      } else if (data) {
        setTeachers(teachers.map((t) => (t.id === data.id ? data : t)));
        toast.success('Teacher updated successfully');
        closeAddEditModal();
      }
    } else {
      // Create
      const { data, error } = await supabase
        .from('teachers')
        .insert({ ...values, school_id: schoolId })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
      } else if (data) {
        setTeachers([...teachers, data]);
        toast.success('Teacher created successfully');
        closeAddEditModal();
      }
    }
  };

  const rows = teachers.map((teacher) => (
    <Table.Tr key={teacher.id}>
      <Table.Td>{`${teacher.first_name} ${teacher.last_name}`}</Table.Td>
      <Table.Td>{teacher.email}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="gray" onClick={() => handleEditTeacher(teacher)}>
            <IconPencil style={{ width: rem(16), height: rem(16) }} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteTeacher(teacher)}>
            <IconTrash style={{ width: rem(16), height: rem(16) }} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Group justify="flex-end" mb="md">
        <Button onClick={handleAddTeacher}>Add New Teacher</Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={3} align="center">
                No teachers found.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={addEditModalOpened}
        onClose={closeAddEditModal}
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
              <Button variant="default" onClick={closeAddEditModal}>
                Cancel
              </Button>
              <Button type="submit">{selectedTeacher ? 'Update Teacher' : 'Create Teacher'}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Confirm Deletion">
        <Stack>
          <Text>
            Are you sure you want to delete{' '}
            <b>
              {selectedTeacher?.first_name} {selectedTeacher?.last_name}
            </b>
            ? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
