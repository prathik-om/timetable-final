'use client';

import { useState } from 'react';
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

// Define the shape of a subject based on your database schema
type Subject = Database['public']['Tables']['subjects']['Row'];

// Define the shape of the form data
type SubjectFormData = Omit<Subject, 'id' | 'created_at' | 'school_id'>;

// Define the props for the component
type SubjectsClientUIProps = {
  initialSubjects: Subject[];
  schoolId: string;
};

export default function SubjectsClientUI({ initialSubjects, schoolId }: SubjectsClientUIProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Hooks for controlling modals
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);

  // Form hook for create/edit functionality
  const form = useForm<SubjectFormData>({
    initialValues: {
      name: '',
      code: '',
      subject_type: '',
    },
    validate: {
      name: (value) => (value && value.trim().length > 0 ? null : 'Subject name is required'),
      code: (value) => (value && value.trim().length > 0 ? null : 'Subject code is required'),
      subject_type: (value) => (value && value.trim().length > 0 ? null : 'Type is required'),
    },
  });

  // Handler to open the modal for adding a new subject
  const handleAdd = () => {
    setSelectedSubject(null);
    form.reset();
    openModal();
  };

  // Handler to open the modal for editing an existing subject
  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    form.setValues({
      name: subject.name,
      code: subject.code,
      subject_type: subject.subject_type,
    });
    openModal();
  };

  // Handler to open the delete confirmation modal
  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    openDeleteModal();
  };

  // Handler to confirm and execute the delete operation
  const confirmDelete = async () => {
    if (!selectedSubject) return;

    toast.promise(
      async () => {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .match({ id: selectedSubject.id });
        if (error) throw new Error(error.message);
        closeDeleteModal();
        router.refresh(); // Refresh server-side data
      },
      {
        loading: 'Deleting subject...',
        success: 'Subject deleted successfully!',
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  // Handler for form submission (create or update)
  const handleSubmit = async (values: SubjectFormData) => {
    const subjectData = { ...values, school_id: schoolId };

    const promise = selectedSubject
      ? supabase.from('subjects').update(subjectData).match({ id: selectedSubject.id })
      : supabase.from('subjects').insert(subjectData);

    toast.promise(
      async () => {
        const { error } = await promise;
        if (error) throw new Error(error.message);
        closeModal();
        router.refresh(); // Refresh server-side data
      },
      {
        loading: selectedSubject ? 'Updating subject...' : 'Creating subject...',
        success: selectedSubject
          ? 'Subject updated successfully!'
          : 'Subject created successfully!',
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  // Map subject data to table rows
  const rows = initialSubjects.map((subject) => (
    <Table.Tr key={subject.id}>
      <Table.Td>{subject.name}</Table.Td>
      <Table.Td>{subject.code}</Table.Td>
      <Table.Td>{subject.subject_type}</Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(subject)}>
            <IconPencil style={{ width: rem(16), height: rem(16) }} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(subject)}>
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
          <Button onClick={handleAdd}>Add New Subject</Button>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Subject Name</Table.Th>
              <Table.Th>Code</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center">
                    No subjects found.
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
        title={selectedSubject ? 'Edit Subject' : 'Add New Subject'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              required
              label="Subject Name"
              placeholder="e.g., Mathematics"
              {...form.getInputProps('name')}
            />
            <TextInput
              required
              label="Subject Code"
              placeholder="e.g., MATH101"
              {...form.getInputProps('code')}
            />
            <TextInput
              required
              label="Type"
              placeholder="e.g., Theory or Practical"
              {...form.getInputProps('subject_type')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">{selectedSubject ? 'Update Subject' : 'Create Subject'}</Button>
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
          Are you sure you want to delete the subject "{selectedSubject?.name}"? This action cannot
          be undone.
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
