'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Accordion, Alert, Button, Card, Code, Loader, MultiSelect, Select, Text, Title } from '@mantine/core';
import { createClient } from '@/utils/supabase/client';
import TimetableDisplay from './_components/TimetableDisplay';

// Define types for our data
type Term = {
  id: string;
  name: string;
};

type Scope = 'school' | 'grade' | 'class' | 'teacher';

type ClassSection = {
  id: string;
  name: string;
  grade_level: number;
};

type Teacher = {
  id: string;
  first_name: string;
  last_name: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5002';

export default function GeneratorPage() {
  const supabase = createClient();
  const [terms, setTerms] = useState<Term[]>([]);
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<Scope>('school');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Check session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
      setSessionChecked(true);
    };
    checkSession();
  }, [supabase.auth]);

  // Fetch data when session is confirmed
  useEffect(() => {
    if (!sessionChecked) return;

    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please log in to continue');
          return;
        }

        const [termsResult, classSectionsResult, teachersResult] = await Promise.all([
          supabase.from('terms').select('id, name').eq('user_id', user.id),
          supabase.from('class_sections').select('id, name, grade_level').eq('user_id', user.id),
          supabase.from('teachers').select('id, first_name, last_name').eq('user_id', user.id)
        ]);

        if (termsResult.error) {
          console.error('Error fetching terms:', termsResult.error);
          toast.error('Error fetching terms');
          return;
        }

        if (termsResult.data) setTerms(termsResult.data);
        if (classSectionsResult.data) setClassSections(classSectionsResult.data);
        if (teachersResult.data) setTeachers(teachersResult.data);
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error('Error fetching data');
      }
    }
    fetchData();
  }, [supabase, sessionChecked]);

  // Handler for updating lesson schedule
  const handleEventUpdate = useCallback(
    async (lessonId: string, newDay: number, newStartTime: string) => {
      if (!selectedTerm) return;

      console.log('Updating lesson:', { lessonId, newDay, newStartTime });

      try {
        const response = await fetch(`${API_BASE_URL}/update-lesson`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            term_id: selectedTerm,
            lesson_id: lessonId,
            new_day: newDay,
            new_start_time: newStartTime,
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to update lesson schedule');
        }

        // Update the local state with the new timetable
        if (responseData.timetable) {
          setResult((prev: any) => ({
            ...prev,
            timetable: responseData.timetable,
          }));
        }
      } catch (err) {
        throw err;
      }
    },
    [selectedTerm]
  );

  // This function is called when the button is clicked
  const handleGenerate = async () => {
    if (!selectedTerm) {
      toast.error('Please select a term first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    toast.info('Starting schedule generation... This may take a moment.');

    try {
      // Get the current user's ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to generate a schedule.');
        return;
      }
      const requestBody = {
        term_id: selectedTerm,
        user_id: user.id, // Pass user_id to backend
        scope: selectedScope,
        ...(selectedScope === 'grade' && { grade_levels: selectedGrades }),
        ...(selectedScope === 'class' && { class_section_ids: selectedClasses }),
        ...(selectedScope === 'teacher' && { teacher_ids: selectedTeachers }),
      };

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'An unknown error occurred.');
      }

      setResult(responseData);
      toast.success(responseData.message || 'Schedule generated!');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Generation failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTerm = (value: string | null) => {
    setSelectedTerm(value || '');
  };

  const handleSelectScope = (value: string | null) => {
    if (value && (value === 'school' || value === 'grade' || value === 'class' || value === 'teacher')) {
      setSelectedScope(value);
    }
  };

  // Transform teachers and class sections data for MultiSelect components
  const teacherOptions = teachers.map(teacher => ({
    value: teacher.id,
    label: `${teacher.first_name} ${teacher.last_name}`
  }));

  const classOptions = classSections.map(section => ({
    value: section.id,
    label: `Grade ${section.grade_level} - ${section.name}`
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Title order={1} className="text-3xl font-bold tracking-tight">
          AI Schedule Generator
        </Title>
        <Text c="dimmed" mt="xs">
          Select a term and generation scope to create a new timetable.
        </Text>
      </div>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {terms.length === 0 && (
          <Alert color="yellow" title="No Terms Found" className="mb-4">
            No terms are available. Please add a term in the admin panel first.
          </Alert>
        )}
        <Select
          label="Select a Term to Generate"
          placeholder="Pick one"
          data={terms.map((term) => ({ value: term.id, label: term.name }))}
          value={selectedTerm}
          onChange={(value) => setSelectedTerm(value || '')}
          disabled={isLoading || terms.length === 0}
          className="mb-4"
        />

        <Select
          label="Generation Scope"
          placeholder="Select scope"
          data={[
            { value: 'school', label: 'Entire School' },
            { value: 'grade', label: 'By Grade Level' },
            { value: 'class', label: 'By Class Section' },
            { value: 'teacher', label: 'By Teacher' },
          ]}
          value={selectedScope}
          onChange={(value) => setSelectedScope((value as Scope) || 'school')}
          disabled={isLoading}
          className="mb-4"
        />

        {selectedScope === 'grade' && (
          <MultiSelect
            label="Select Grade Levels"
            placeholder="Pick grade levels"
            data={Array.from({ length: 12 }, (_, i) => ({
              value: (i + 1).toString(),
              label: `Grade ${i + 1}`,
            }))}
            value={selectedGrades}
            onChange={setSelectedGrades}
            disabled={isLoading}
            className="mb-4"
          />
        )}

        {selectedScope === 'class' && (
          <MultiSelect
            label="Select Class Sections"
            placeholder="Pick class sections"
            data={classOptions}
            value={selectedClasses}
            onChange={setSelectedClasses}
            disabled={isLoading}
            className="mb-4"
          />
        )}

        {selectedScope === 'teacher' && (
          <MultiSelect
            label="Select Teachers"
            placeholder="Pick teachers"
            data={teacherOptions}
            value={selectedTeachers}
            onChange={setSelectedTeachers}
            disabled={isLoading}
            className="mb-4"
          />
        )}

        <Button 
          onClick={handleGenerate} 
          disabled={
            isLoading || 
            !selectedTerm || 
            (selectedScope === 'grade' && !selectedGrades.length) ||
            (selectedScope === 'class' && !selectedClasses.length) ||
            (selectedScope === 'teacher' && !selectedTeachers.length)
          } 
          fullWidth
        >
          {isLoading ? <Loader color="white" size="sm" /> : 'Generate Schedule'}
        </Button>
      </Card>

      {error && (
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg">
          {error}
        </Alert>
      )}

      {result && result.timetable && (
        <TimetableDisplay timetable={result.timetable} onEventUpdate={handleEventUpdate} />
      )}
    </div>
  );
}
