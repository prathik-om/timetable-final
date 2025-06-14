'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, Card, Group, Select, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Qualification {
  id: string;
  teacher_id: string;
  subject_id: string;
}

interface Props {
  teachers: Teacher[];
  subjects: Subject[];
  qualifications: Qualification[];
  schoolId: string;
}

export default function TeacherQualificationsClient({ teachers, subjects, qualifications, schoolId }: Props) {
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleAddQualification = async () => {
    if (!selectedTeacher || !selectedSubject) {
      notifications.show({
        title: 'Error',
        message: 'Please select both a teacher and a subject',
        color: 'red',
      });
      return;
    }

    // Check if qualification already exists
    const existingQualification = qualifications.find(
      q => q.teacher_id === selectedTeacher && q.subject_id === selectedSubject
    );

    if (existingQualification) {
      notifications.show({
        title: 'Error',
        message: 'This teacher is already qualified to teach this subject',
        color: 'red',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('teacher_qualifications')
        .insert({
          teacher_id: selectedTeacher,
          subject_id: selectedSubject,
          school_id: schoolId,
        });

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Qualification added successfully',
        color: 'green',
      });

      // Reset selections
      setSelectedTeacher(null);
      setSelectedSubject(null);

      // Refresh the page to show new qualification
      window.location.reload();
    } catch (error) {
      console.error('Error adding qualification:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add qualification',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveQualification = async (qualificationId: string) => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('teacher_qualifications')
        .delete()
        .eq('id', qualificationId);

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Qualification removed successfully',
        color: 'green',
      });

      // Refresh the page to show updated qualifications
      window.location.reload();
    } catch (error) {
      console.error('Error removing qualification:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to remove qualification',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card withBorder>
        <Title order={2} mb="md">Add New Qualification</Title>
        <Stack>
          <Select
            label="Teacher"
            placeholder="Select a teacher"
            data={teachers.map(teacher => ({
              value: teacher.id,
              label: `${teacher.first_name} ${teacher.last_name}`,
            }))}
            value={selectedTeacher}
            onChange={setSelectedTeacher}
          />
          <Select
            label="Subject"
            placeholder="Select a subject"
            data={subjects.map(subject => ({
              value: subject.id,
              label: subject.name,
            }))}
            value={selectedSubject}
            onChange={setSelectedSubject}
          />
          <Button
            onClick={handleAddQualification}
            loading={isLoading}
            disabled={!selectedTeacher || !selectedSubject}
          >
            Add Qualification
          </Button>
        </Stack>
      </Card>

      <Card withBorder>
        <Title order={2} mb="md">Current Qualifications</Title>
        <Stack>
          {teachers.map(teacher => {
            const teacherQualifications = qualifications.filter(q => q.teacher_id === teacher.id);
            const qualifiedSubjects = teacherQualifications.map(q => {
              const subject = subjects.find(s => s.id === q.subject_id);
              return { id: q.id, name: subject?.name || 'Unknown Subject' };
            });

            return (
              <div key={teacher.id} className="border-b pb-4 last:border-b-0">
                <Text fw={500} size="lg" mb="xs">
                  {teacher.first_name} {teacher.last_name}
                </Text>
                {qualifiedSubjects.length > 0 ? (
                  <Group>
                    {qualifiedSubjects.map(subject => (
                      <Button
                        key={subject.id}
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() => handleRemoveQualification(subject.id)}
                        loading={isLoading}
                      >
                        {subject.name} ×
                      </Button>
                    ))}
                  </Group>
                ) : (
                  <Text c="dimmed">No qualifications yet</Text>
                )}
              </div>
            );
          })}
        </Stack>
      </Card>
    </div>
  );
} 