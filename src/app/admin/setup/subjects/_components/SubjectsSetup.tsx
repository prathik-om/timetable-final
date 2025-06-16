'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  ActionIcon,
  Button,
  Card,
  Container,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { createClient } from '@/utils/supabase/client';

type Subject = {
  id: string;
  name: string;
  code: string;
  subject_type: string;
};

type Props = {
  initialSubjects: Subject[];
  schoolId: string;
  userId: string;
};

type SubjectFormData = Omit<Subject, 'id'>;

export default function SubjectsSetup({ initialSubjects, schoolId, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const form = useForm<SubjectFormData>({
    initialValues: {
      name: '',
      code: '',
      subject_type: '',
    },
    validate: {
      name: (value) => (value && value.trim().length > 0 ? null : 'Subject name is required'),
      code: (value) => (value && value.trim().length > 0 ? null : 'Subject code is required'),
      subject_type: (value) => (value && value.trim().length > 0 ? null : 'Subject type is required'),
    },
  });

  const handleAdd = () => {
    setSelectedSubject(null);
    form.reset();
    openModal();
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    form.setValues({
      name: subject.name,
      code: subject.code,
      subject_type: subject.subject_type,
    });
    openModal();
  };

  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    openDeleteModal();
  };

  const handleCompleteSetup = async () => {
    if (initialSubjects.length === 0) {
      toast.error('Please add at least one subject before completing setup');
      return;
    }

    try {
      // Update school setup status
      const { error } = await supabase
        .from('schools')
        .update({ is_setup_complete: true })
        .eq('id', schoolId);

      if (error) throw error;

      toast.success('School setup completed successfully!');
      router.push('/admin/dashboard'); // Navigate to the main dashboard
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to complete setup');
    }
  };

  const confirmDelete = async () => {
    if (!selectedSubject) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .match({ id: selectedSubject.id });
        
      if (error) throw error;
      
      toast.success('Subject deleted successfully!');
      closeDeleteModal();
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete subject');
    }
  };

  const handleSubmit = async (values: SubjectFormData) => {
    const subjectData = { ...values, school_id: schoolId, user_id: userId };

    try {
      if (selectedSubject) {
        const { error } = await supabase
          .from('subjects')
          .update(subjectData)
          .match({ id: selectedSubject.id });
        if (error) throw error;
        toast.success('Subject updated successfully!');
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert([subjectData]);
        if (error) throw error;
        toast.success('Subject created successfully!');
      }

      closeModal();
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save subject');
    }
  };

  return (
    <Container size="md">
      <Stack>
        <Group justify="space-between" mb="md">
          <Text size="sm" c="dimmed">
            Add all subjects taught at your school. You can specify theory and practical subjects separately.
          </Text>
          <Button leftSection={<IconPlus size={14} />} onClick={handleAdd}>
            Add Subject
          </Button>
        </Group>

        <Card withBorder shadow="sm">
          <Title order={3} mb="md">Subjects</Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th style={{ width: '100px' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {initialSubjects.length > 0 ? (
                initialSubjects.map((subject) => (
                  <Table.Tr key={subject.id}>
                    <Table.Td>{subject.name}</Table.Td>
                    <Table.Td>{subject.code}</Table.Td>
                    <Table.Td>{subject.subject_type}</Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="flex-end">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => handleEdit(subject)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(subject)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" ta="center">
                      No subjects added yet. Click the Add Subject button to get started.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <Group justify="flex-end" mt="xl">
          <Button size="md" onClick={handleCompleteSetup}>
            Complete Setup
          </Button>
        </Group>

        {/* Add/Edit Modal */}
        <Modal
          opened={modalOpened}
          onClose={closeModal}
          title={selectedSubject ? 'Edit Subject' : 'Add New Subject'}
          centered
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
                label="Subject Type"
                placeholder="e.g., Theory or Practical"
                {...form.getInputProps('subject_type')}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedSubject ? 'Update Subject' : 'Add Subject'}
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
            Are you sure you want to delete the subject "{selectedSubject?.name}"? This action cannot
            be undone.
          </Text>
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete}>
              Delete Subject
            </Button>
          </Group>
        </Modal>
      </Stack>
    </Container>
  );
}
