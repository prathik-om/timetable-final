'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button, Card, Group, Modal, NumberInput, Select, Stack, Table, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Database } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';

type ClassOffering = Database['public']['Tables']['class_offerings']['Row'];
type Term = Database['public']['Tables']['terms']['Row'];
type ClassSection = Database['public']['Tables']['class_sections']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

type ClassOfferingsClientUIProps = {
  initialOfferings: ClassOffering[];
  terms: Term[];
  classSections: ClassSection[];
  subjects: Subject[];
  schoolId: string;
};

export default function ClassOfferingsClientUI({
  initialOfferings,
  terms,
  classSections,
  subjects,
  schoolId,
}: ClassOfferingsClientUIProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedOffering, setSelectedOffering] = useState<ClassOffering | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      term_id: '',
      class_section_id: '',
      subject_id: '',
      periods_per_week: 0,
    },
    validate: {
      term_id: (value) => (!value ? 'Term is required' : null),
      class_section_id: (value) => (!value ? 'Class section is required' : null),
      subject_id: (value) => (!value ? 'Subject is required' : null),
      periods_per_week: (value) => (value < 1 ? 'Must have at least 1 period per week' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const offeringData = {
        term_id: values.term_id,
        class_section_id: values.class_section_id,
        subject_id: values.subject_id,
        periods_per_week: values.periods_per_week,
      };

      console.log('Submitting data:', offeringData);

      const { data, error } = selectedOffering
        ? await supabase.from('class_offerings').update(offeringData).eq('id', selectedOffering.id)
        : await supabase.from('class_offerings').insert(offeringData);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      router.refresh();
      setIsModalOpen(false);
      setSelectedOffering(null);
      form.reset();
      toast.success('Class offering saved successfully!');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error(error instanceof Error ? error.message : 'Error saving class offering');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from('class_offerings').delete().eq('id', deleteId);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      router.refresh();
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      toast.success('Class offering deleted successfully!');
    } catch (error) {
      console.error('Error in confirmDelete:', error);
      toast.error(error instanceof Error ? error.message : 'Error deleting class offering');
    }
  };

  // Helper function to get human-readable names
  const getTermName = (termId: string) =>
    terms.find((t) => t.id === termId)?.name || 'Unknown Term';

  const getClassSectionName = (sectionId: string) =>
    classSections.find((s) => s.id === sectionId)?.name || 'Unknown Section';

  const getSubjectName = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.name || 'Unknown Subject';

  return (
    <Stack>
      <Group justify="flex-end">
        <Button onClick={() => setIsModalOpen(true)}>Add New Offering</Button>
      </Group>

      <Card shadow="sm" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Term</Table.Th>
              <Table.Th>Class Section</Table.Th>
              <Table.Th>Subject</Table.Th>
              <Table.Th>Periods per Week</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {initialOfferings.map((offering) => (
              <Table.Tr key={offering.id}>
                <Table.Td>{getTermName(offering.term_id)}</Table.Td>
                <Table.Td>{getClassSectionName(offering.class_section_id)}</Table.Td>
                <Table.Td>{getSubjectName(offering.subject_id)}</Table.Td>
                <Table.Td>{offering.periods_per_week}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      onClick={() => {
                        setSelectedOffering(offering);
                        form.setValues({
                          term_id: offering.term_id.toString(),
                          class_section_id: offering.class_section_id.toString(),
                          subject_id: offering.subject_id.toString(),
                          periods_per_week: offering.periods_per_week,
                        });
                        setIsModalOpen(true);
                      }}
                      variant="subtle"
                      color="blue"
                      size="xs"
                    >
                      <IconPencil size={16} />
                    </Button>
                    <Button
                      onClick={() => handleDelete(offering.id)}
                      variant="subtle"
                      color="red"
                      size="xs"
                    >
                      <IconTrash size={16} />
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOffering(null);
          form.reset();
        }}
        title={selectedOffering ? 'Edit Class Offering' : 'Add New Class Offering'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Term"
              placeholder="Select a term"
              data={terms.map((term) => ({ value: term.id.toString(), label: term.name }))}
              {...form.getInputProps('term_id')}
            />
            <Select
              label="Class Section"
              placeholder="Select a class section"
              data={classSections.map((section) => ({
                value: section.id.toString(),
                label: section.name,
              }))}
              {...form.getInputProps('class_section_id')}
            />
            <Select
              label="Subject"
              placeholder="Select a subject"
              data={subjects.map((subject) => ({
                value: subject.id.toString(),
                label: subject.name,
              }))}
              {...form.getInputProps('subject_id')}
            />
            <NumberInput
              label="Periods per Week"
              placeholder="Enter number of periods"
              min={1}
              {...form.getInputProps('periods_per_week')}
            />
            <Group justify="flex-end">
              <Button type="submit">Save</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <Text mb="xl">Are you sure you want to delete this class offering?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
