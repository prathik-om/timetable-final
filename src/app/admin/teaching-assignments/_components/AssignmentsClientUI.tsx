'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database';
import { toast } from 'sonner';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import {
  Card,
  Button,
  Table,
  Modal,
  Select,
  Group,
  Text,
  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';

type TeachingAssignment = Database['public']['Tables']['teaching_assignments']['Row'];
type ClassOffering = Database['public']['Tables']['class_offerings']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];
type TeacherQualification = Database['public']['Tables']['teacher_qualifications']['Row'];
type Term = Database['public']['Tables']['terms']['Row'];
type ClassSection = Database['public']['Tables']['class_sections']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

type AssignmentsClientUIProps = {
  initialAssignments: TeachingAssignment[];
  classOfferings: (ClassOffering & {
    term: Term;
    class_section: ClassSection;
    subject: Subject;
  })[];
  teachers: Teacher[];
  teacherQualifications: TeacherQualification[];
  schoolId: string;
};

export default function AssignmentsClientUI({
  initialAssignments,
  classOfferings,
  teachers,
  teacherQualifications,
  schoolId,
}: AssignmentsClientUIProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedAssignment, setSelectedAssignment] = useState<TeachingAssignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<ClassOffering | null>(null);

  const form = useForm({
    initialValues: {
      class_offering_id: '',
      teacher_id: '',
    },
    validate: {
      class_offering_id: (value) => (!value ? 'Class offering is required' : null),
      teacher_id: (value) => (!value ? 'Teacher is required' : null),
    },
  });

  // Helper function to get qualified teachers for a subject
  const getQualifiedTeachers = (subjectId: number) => {
    const qualifiedTeacherIds = teacherQualifications
      .filter(q => q.subject_id === subjectId)
      .map(q => q.teacher_id);
    
    return teachers.filter(teacher => qualifiedTeacherIds.includes(teacher.id));
  };

  // Helper function to format class offering display
  const formatClassOffering = (offering: ClassOffering & {
    term: Term;
    class_section: ClassSection;
    subject: Subject;
  }) => {
    return `${offering.class_section.name}: ${offering.subject.name} (${offering.term.name})`;
  };

  // Helper function to get teacher name
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher';
  };

  // Helper function to get class offering details
  const getClassOfferingDetails = (offeringId: string) => {
    return classOfferings.find(o => o.id === offeringId);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const assignmentData = {
        class_offering_id: values.class_offering_id,
        teacher_id: values.teacher_id,
      };

      console.log('Submitting data:', assignmentData);

      const { data, error } = selectedAssignment
        ? await supabase
            .from('teaching_assignments')
            .update(assignmentData)
            .eq('id', selectedAssignment.id)
        : await supabase.from('teaching_assignments').insert(assignmentData);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      router.refresh();
      setIsModalOpen(false);
      setSelectedAssignment(null);
      setSelectedOffering(null);
      form.reset();
      toast.success('Teaching assignment saved successfully!');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error(error instanceof Error ? error.message : 'Error saving teaching assignment');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from('teaching_assignments').delete().eq('id', deleteId);
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      router.refresh();
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      toast.success('Teaching assignment deleted successfully!');
    } catch (error) {
      console.error('Error in confirmDelete:', error);
      toast.error(error instanceof Error ? error.message : 'Error deleting teaching assignment');
    }
  };

  return (
    <Stack>
      <Group justify="flex-end">
        <Button onClick={() => setIsModalOpen(true)}>Add New Assignment</Button>
      </Group>

      <Card shadow="sm" withBorder>
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
            {initialAssignments.map((assignment) => {
              const offering = getClassOfferingDetails(assignment.class_offering_id);
              if (!offering) return null;

              return (
                <Table.Tr key={assignment.id}>
                  <Table.Td>{getTeacherName(assignment.teacher_id)}</Table.Td>
                  <Table.Td>{offering.subject.name}</Table.Td>
                  <Table.Td>{offering.class_section.name}</Table.Td>
                  <Table.Td>{offering.term.name}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setSelectedOffering(offering);
                          form.setValues({
                            class_offering_id: assignment.class_offering_id,
                            teacher_id: assignment.teacher_id,
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
                        onClick={() => handleDelete(assignment.id)}
                        variant="subtle"
                        color="red"
                        size="xs"
                      >
                        <IconTrash size={16} />
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAssignment(null);
          setSelectedOffering(null);
          form.reset();
        }}
        title={selectedAssignment ? 'Edit Teaching Assignment' : 'Add New Teaching Assignment'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Class Offering"
              placeholder="Select a class offering"
              data={classOfferings.map(offering => ({
                value: offering.id,
                label: formatClassOffering(offering),
              }))}
              {...form.getInputProps('class_offering_id')}
              onChange={(value) => {
                form.setFieldValue('class_offering_id', value || '');
                form.setFieldValue('teacher_id', '');
                setSelectedOffering(
                  value ? classOfferings.find(o => o.id === value) || null : null
                );
              }}
            />
            <Select
              label="Teacher"
              placeholder="Select a teacher"
              data={
                selectedOffering
                  ? getQualifiedTeachers(selectedOffering.subject_id).map(teacher => ({
                      value: teacher.id,
                      label: `${teacher.first_name} ${teacher.last_name}`,
                    }))
                  : []
              }
              disabled={!selectedOffering}
              {...form.getInputProps('teacher_id')}
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
        <Text mb="xl">Are you sure you want to delete this teaching assignment?</Text>
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