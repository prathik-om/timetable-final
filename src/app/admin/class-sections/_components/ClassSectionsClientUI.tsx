'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database';
import { toast } from 'sonner';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Card, Button, Table, Modal, NumberInput, TextInput, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';

type ClassSection = Database['public']['Tables']['class_sections']['Row'];

type ClassSectionsClientUIProps = {
  initialClassSections: ClassSection[];
  schoolId: string;
};

export default function ClassSectionsClientUI({
  initialClassSections,
  schoolId,
}: ClassSectionsClientUIProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedClassSection, setSelectedClassSection] = useState<ClassSection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      grade_level: 0,
      name: '',
    },
    validate: {
      grade_level: (value) => (value < 1 ? 'Grade level must be at least 1' : null),
      name: (value) => (value.length < 1 ? 'Section name is required' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    const classSectionData = { ...values, school_id: schoolId };

    const promise = selectedClassSection
      ? supabase
          .from('class_sections')
          .update(classSectionData)
          .eq('id', selectedClassSection.id)
      : supabase.from('class_sections').insert(classSectionData);

    toast.promise(
      async () => {
        const { error } = await promise;
        if (error) throw error;
        router.refresh();
        setIsModalOpen(false);
        setSelectedClassSection(null);
        form.reset();
      },
      {
        loading: 'Saving class section...',
        success: 'Class section saved successfully!',
        error: 'Error saving class section.',
      }
    );
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    toast.promise(
      async () => {
        const { error } = await supabase.from('class_sections').delete().eq('id', deleteId);
        if (error) throw error;
        router.refresh();
        setIsDeleteModalOpen(false);
        setDeleteId(null);
      },
      {
        loading: 'Deleting class section...',
        success: 'Class section deleted successfully!',
        error: 'Error deleting class section.',
      }
    );
  };

  return (
    <Card shadow="sm" withBorder>
      <Group justify="flex-end" mb="md">
        <Button onClick={() => setIsModalOpen(true)}>Add New Section</Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Grade Level</Table.Th>
            <Table.Th>Section Name</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {initialClassSections.length > 0 ? (
            initialClassSections.map((section) => (
              <Table.Tr key={section.id}>
                <Table.Td>{section.grade_level}</Table.Td>
                <Table.Td>{section.name}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      onClick={() => {
                        setSelectedClassSection(section);
                        form.setValues(section);
                        setIsModalOpen(true);
                      }}
                      variant="subtle"
                      color="blue"
                      size="xs"
                    >
                      <IconPencil size={16} />
                    </Button>
                    <Button
                      onClick={() => handleDelete(section.id)}
                      variant="subtle"
                      color="red"
                      size="xs"
                    >
                      <IconTrash size={16} />
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={3}>
                <Text c="dimmed" ta="center">
                  No class sections found.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal 
        opened={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClassSection(null);
          form.reset();
        }} 
        title={selectedClassSection ? 'Edit Class Section' : 'Add New Class Section'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <NumberInput
            label="Grade Level"
            placeholder="Enter grade level"
            min={1}
            {...form.getInputProps('grade_level')}
            mb="md"
          />
          <TextInput
            label="Section Name"
            placeholder="Enter section name"
            {...form.getInputProps('name')}
            mb="md"
          />
          <Group justify="flex-end">
            <Button type="submit">Save</Button>
          </Group>
        </form>
      </Modal>

      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <Text mb="xl">Are you sure you want to delete this class section?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Card>
  );
} 