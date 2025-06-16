'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { toast, Toaster } from 'sonner';
import {
  ActionIcon,
  Button,
  Card,
  Container,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { supabase } from '@/lib/supabaseClient';

// #region --- TYPE DEFINITIONS ---
export type Teacher = {
  id: number;
  first_name: string;
  last_name: string;
};

export type Subject = {
  id: number;
  name: string;
};

export type ClassSection = {
  id: number;
  name: string;
};

export type Term = {
  id: number;
  name: string;
};

export type ClassOffering = {
  id: number;
  school_id: string;
  subject_id: number;
  class_section_id: number;
  term_id: number;
  subjects: Subject;
  class_sections: ClassSection;
  terms: Term;
};

export type TeacherQualification = {
  teacher_id: number;
  subject_id: number;
};

export type TeachingAssignment = {
  id: number;
  teacher_id: number;
  class_offering_id: number;
  teachers: Teacher;
  class_offerings: ClassOffering;
};

type AssignmentFormData = {
  class_offering_id: string | null;
  teacher_id: string | null;
};
// #endregion

export function AssignmentsClientComponent({
  initialAssignments,
  teachers,
  classOfferings,
  qualifications,
}: {
  initialAssignments: TeachingAssignment[];
  teachers: Teacher[];
  classOfferings: ClassOffering[];
  qualifications: TeacherQualification[];
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [assignmentToDelete, setAssignmentToDelete] = useState<TeachingAssignment | null>(null);
  const [qualifiedTeachers, setQualifiedTeachers] = useState<Teacher[]>([]);

  const [isModalOpen, modalHandlers] = useDisclosure(false);
  const [isAlertOpen, alertHandlers] = useDisclosure(false);

  const form = useForm<AssignmentFormData>({
    initialValues: { class_offering_id: null, teacher_id: null },
    validate: {
      class_offering_id: (value) => (value ? null : 'A class offering must be selected'),
      teacher_id: (value) => (value ? null : 'A teacher must be selected'),
    },
  });

  // Effect to filter teachers when a class offering is selected
  useEffect(() => {
    const selectedOfferingId = form.values.class_offering_id;
    if (!selectedOfferingId) {
      setQualifiedTeachers([]);
      return;
    }

    const offering = classOfferings.find((o) => o.id === Number(selectedOfferingId));
    if (!offering) return;

    const qualifiedTeacherIds = qualifications
      .filter((q) => q.subject_id === offering.subject_id)
      .map((q) => q.teacher_id);

    const filteredTeachers = teachers.filter((t) => qualifiedTeacherIds.includes(t.id));
    setQualifiedTeachers(filteredTeachers);

    if (form.values.teacher_id && !qualifiedTeacherIds.includes(Number(form.values.teacher_id))) {
      form.setFieldValue('teacher_id', null);
    }
  }, [form.values.class_offering_id, classOfferings, qualifications, teachers, form]);

  const handleAddNew = () => {
    form.reset();
    setQualifiedTeachers([]);
    modalHandlers.open();
  };

  const handleDeleteClick = (assignment: TeachingAssignment) => {
    setAssignmentToDelete(assignment);
    alertHandlers.open();
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;
    const { error } = await supabase
      .from('teaching_assignments')
      .delete()
      .eq('id', assignmentToDelete.id);

    if (error) {
      toast.error(`Failed to delete assignment: ${error.message}`);
    } else {
      const newAssignments = assignments.filter((a) => a.id !== assignmentToDelete.id);
      setAssignments(newAssignments);
      toast.success('Assignment deleted successfully!');
    }
    alertHandlers.close();
  };

  const handleSubmit = async (values: AssignmentFormData) => {
    const { error, data } = await supabase
      .from('teaching_assignments')
      .insert({
        teacher_id: Number(values.teacher_id),
        class_offering_id: Number(values.class_offering_id),
      })
      .select(
        `
        id,
        teachers ( id, first_name, last_name ),
        class_offerings (
          id,
          subject_id,
          subjects ( id, name ),
          class_sections ( id, name ),
          terms ( id, name )
        )
      `
      )
      .single();

    if (error) {
      toast.error(error.message, {
        description: 'This can happen if the assignment already exists.',
      });
    } else if (data) {
      const newAssignment = data as unknown as TeachingAssignment;
      setAssignments([...assignments, newAssignment]);
      toast.success('Assignment created successfully!');
      modalHandlers.close();
    }
  };

  const classOfferingsOptions = useMemo(
    () =>
      classOfferings.map((o) => ({
        value: String(o.id),
        label: `${o.class_sections.name}: ${o.subjects.name} (${o.terms.name})`,
      })),
    [classOfferings]
  );

  const qualifiedTeachersOptions = useMemo(
    () =>
      qualifiedTeachers.map((t) => ({
        value: String(t.id),
        label: `${t.first_name} ${t.last_name}`,
      })),
    [qualifiedTeachers]
  );

  return (
    <Container my="md">
      <Toaster richColors />
      <Group justify="space-between" mb="lg">
        <Title order={2}>Manage Teaching Assignments</Title>
        <Button onClick={handleAddNew}>Add New Assignment</Button>
      </Group>
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Teacher</Table.Th>
              <Table.Th>Subject</Table.Th>
              <Table.Th>Class Section</Table.Th>
              <Table.Th>Term</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {assignments.map((a) => (
              <Table.Tr key={a.id}>
                <Table.Td>{`${a.teachers.first_name} ${a.teachers.last_name}`}</Table.Td>
                <Table.Td>{a.class_offerings.subjects.name}</Table.Td>
                <Table.Td>{a.class_offerings.class_sections.name}</Table.Td>
                <Table.Td>{a.class_offerings.terms.name}</Table.Td>
                <Table.Td>
                  <ActionIcon variant="light" color="red" onClick={() => handleDeleteClick(a)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={isModalOpen} onClose={modalHandlers.close} title="Add New Assignment">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Class Offering"
              placeholder="Select a class to assign"
              data={classOfferingsOptions}
              {...form.getInputProps('class_offering_id')}
              searchable
              required
            />
            <Select
              label="Teacher"
              placeholder="Select a qualified teacher"
              data={qualifiedTeachersOptions}
              {...form.getInputProps('teacher_id')}
              disabled={!form.values.class_offering_id}
              searchable
              required
            />
            <Group justify="flex-end" mt="md">
              <Button type="submit">Create Assignment</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={isAlertOpen} onClose={alertHandlers.close} title="Confirm Deletion">
        <Text>Are you sure you want to delete this assignment? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={alertHandlers.close}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
