'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Alert, Button, Card, Group, Select, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';

interface Term {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface ClassSection {
  id: string;
  name: string;
  grade_level: number;
}

interface Subject {
  id: string;
  name: string;
}

interface ClassOffering {
  id: string;
  term: Term;
  class_section: ClassSection;
  subject: Subject;
  periods_per_week: number;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

interface Qualification {
  id: string;
  teacher_id: string;
  subject_id: string;
}

interface Assignment {
  id: string;
  class_offering: ClassOffering;
  teacher: Teacher;
}

interface DataValidation {
  assignments: {
    total: number;
    withValidClassOffering: number;
    withValidTeacher: number;
  };
  classOfferings: {
    total: number;
    withValidTerm: number;
    withValidClassSection: number;
    withValidSubject: number;
  };
  teachers: {
    total: number;
  };
  qualifications: {
    total: number;
  };
}

interface Props {
  assignments: Assignment[];
  classOfferings: ClassOffering[];
  teachers: Teacher[];
  qualifications: Qualification[];
  schoolId: string;
  dataValidation: DataValidation;
}

export default function TeachingAssignmentsClient({ 
  assignments, 
  classOfferings, 
  teachers, 
  qualifications, 
  schoolId,
  dataValidation 
}: Props) {
  const [selectedOffering, setSelectedOffering] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Filter out class offerings that already have a teacher assigned
  const availableClassOfferings = classOfferings.filter(
    offering => !assignments.some(assignment => assignment.class_offering.id === offering.id)
  );

  // Get the selected class offering's subject
  const selectedOfferingData = useMemo(() => {
    if (!selectedOffering) return null;
    return classOfferings.find(o => o.id === selectedOffering);
  }, [selectedOffering, classOfferings]);

  // Filter teachers based on qualifications for the selected subject
  const qualifiedTeachers = useMemo(() => {
    if (!selectedOfferingData) return teachers;

    return teachers.filter(teacher => 
      qualifications.some(q => 
        q.teacher_id === teacher.id && 
        q.subject_id === selectedOfferingData.subject.id
      )
    );
  }, [selectedOfferingData, teachers, qualifications]);

  // Reset teacher selection when offering changes
  const handleOfferingChange = (value: string | null) => {
    setSelectedOffering(value);
    setSelectedTeacher(null); // Reset teacher selection
  };

  const handleAddAssignment = async () => {
    if (!selectedOffering || !selectedTeacher) {
      notifications.show({
        title: 'Error',
        message: 'Please select both a class offering and a teacher',
        color: 'red',
      });
      return;
    }

    // Check if class offering already has a teacher
    const existingAssignment = assignments.find(
      a => a.class_offering.id === selectedOffering
    );

    if (existingAssignment) {
      notifications.show({
        title: 'Error',
        message: `This class already has a teacher assigned: ${existingAssignment.teacher.first_name} ${existingAssignment.teacher.last_name}`,
        color: 'red',
      });
      return;
    }

    // Get the class offering to check subject
    const offering = classOfferings.find(o => o.id === selectedOffering);
    if (!offering) {
      notifications.show({
        title: 'Error',
        message: 'Selected class offering not found',
        color: 'red',
      });
      return;
    }

    // Check if teacher is qualified to teach this subject
    const isQualified = qualifications.some(
      q => q.teacher_id === selectedTeacher && q.subject_id === offering.subject.id
    );

    if (!isQualified) {
      notifications.show({
        title: 'Error',
        message: 'This teacher is not qualified to teach this subject',
        color: 'red',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('teaching_assignments')
        .insert({
          class_offering_id: selectedOffering,
          teacher_id: selectedTeacher,
          school_id: schoolId,
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          notifications.show({
            title: 'Error',
            message: 'This class already has a teacher assigned',
            color: 'red',
          });
        } else {
          throw error;
        }
        return;
      }

      notifications.show({
        title: 'Success',
        message: 'Assignment added successfully',
        color: 'green',
      });

      // Reset selections
      setSelectedOffering(null);
      setSelectedTeacher(null);

      // Refresh the page to show new assignment
      window.location.reload();
    } catch (error) {
      console.error('Error adding assignment:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add assignment',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('teaching_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Assignment removed successfully',
        color: 'green',
      });

      // Refresh the page to show updated assignments
      window.location.reload();
    } catch (error) {
      console.error('Error removing assignment:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to remove assignment',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group assignments by term
  const assignmentsByTerm = assignments.reduce((acc, assignment) => {
    if (!assignment.class_offering?.term) return acc;
    
    const termId = assignment.class_offering.term.id;
    if (!acc[termId]) {
      acc[termId] = {
        term: assignment.class_offering.term,
        assignments: [],
      };
    }
    acc[termId].assignments.push(assignment);
    return acc;
  }, {} as Record<string, { term: Term; assignments: Assignment[] }>);

  // Check for data inconsistencies
  const hasDataIssues = 
    dataValidation.assignments.withValidClassOffering < dataValidation.assignments.total ||
    dataValidation.assignments.withValidTeacher < dataValidation.assignments.total ||
    dataValidation.classOfferings.withValidTerm < dataValidation.classOfferings.total ||
    dataValidation.classOfferings.withValidClassSection < dataValidation.classOfferings.total ||
    dataValidation.classOfferings.withValidSubject < dataValidation.classOfferings.total;

  return (
    <div className="space-y-6">
      {hasDataIssues && (
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Data Inconsistency Detected" 
          color="yellow"
          variant="light"
        >
          Some data is missing or incomplete. This may affect the display of assignments. Please contact support if this persists.
        </Alert>
      )}

      <Card withBorder>
        <Title order={2} mb="md">Add New Assignment</Title>
        <Stack>
          <Select
            label="Class Offering"
            placeholder="Select a class offering"
            data={availableClassOfferings.map(offering => ({
              value: offering.id,
              label: `Grade ${offering.class_section.grade_level} ${offering.class_section.name} - ${offering.subject.name} (${offering.term.name})`,
            }))}
            value={selectedOffering}
            onChange={handleOfferingChange}
            disabled={availableClassOfferings.length === 0}
          />
          {availableClassOfferings.length === 0 && (
            <Text c="dimmed" size="sm">All classes already have teachers assigned</Text>
          )}
          <Select
            label="Teacher"
            placeholder="Select a teacher"
            data={qualifiedTeachers.map(teacher => ({
              value: teacher.id,
              label: `${teacher.first_name} ${teacher.last_name}`,
            }))}
            value={selectedTeacher}
            onChange={setSelectedTeacher}
            disabled={!selectedOffering}
            description={selectedOffering && qualifiedTeachers.length === 0 ? 
              "No qualified teachers found for this subject" : 
              selectedOffering ? 
              `Showing ${qualifiedTeachers.length} qualified teacher(s)` : 
              "Select a class offering first"}
          />
          <Button
            onClick={handleAddAssignment}
            loading={isLoading}
            disabled={!selectedOffering || !selectedTeacher}
          >
            Add Assignment
          </Button>
        </Stack>
      </Card>

      <Card withBorder>
        <Title order={2} mb="md">Current Assignments</Title>
        <Stack>
          {Object.values(assignmentsByTerm).map(({ term, assignments }) => (
            <div key={term.id} className="border-b pb-4 last:border-b-0">
              <Text fw={500} size="lg" mb="xs">
                {term.name}
              </Text>
              {assignments.length > 0 ? (
                <Stack>
                  {assignments.map(assignment => (
                    <Group key={assignment.id} justify="space-between">
                      <div>
                        <Text fw={500}>
                          Grade {assignment.class_offering.class_section.grade_level} {assignment.class_offering.class_section.name} - {assignment.class_offering.subject.name}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Teacher: {assignment.teacher.first_name} {assignment.teacher.last_name}
                        </Text>
                      </div>
                      <Button
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        loading={isLoading}
                      >
                        Remove
                      </Button>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed">No assignments for this term</Text>
              )}
            </div>
          ))}
          {Object.keys(assignmentsByTerm).length === 0 && (
            <Text c="dimmed">No assignments found</Text>
          )}
        </Stack>
      </Card>
    </div>
  );
} 