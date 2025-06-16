'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Button, 
  Card, 
  Container, 
  TextInput, 
  Stack, 
  Text, 
  Group, 
  ActionIcon,
  NumberInput,
  Grid
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { createClient } from '@/utils/supabase/client';
import { IconTrash, IconPlus } from '@tabler/icons-react';

type ClassSection = {
  id: string;
  name: string;
  grade_level: number;
  student_count: number;
};

type Props = {
  initialSections: ClassSection[];
  schoolId: string;
  userId: string;
};

export default function ClassSectionsSetup({ initialSections, schoolId, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm({
    initialValues: {
      sections: initialSections.length > 0
        ? initialSections.map(section => ({
            name: section.name,
            grade_level: section.grade_level,
            student_count: section.student_count,
            id: section.id
          }))
        : [
            {
              name: '11A',
              grade_level: 11,
              student_count: 30,
              id: ''
            }
          ],
    },
    validate: {
      sections: {
        name: (value) => (!value ? 'Name is required' : null),
        grade_level: (value) => {
          if (!value) return 'Grade level is required';
          if (value < 1 || value > 12) return 'Grade level must be between 1 and 12';
          return null;
        },
        student_count: (value) => {
          if (!value) return 'Student count is required';
          if (value < 1) return 'Student count must be positive';
          return null;
        },
      },
    },
  });

  const addSection = () => {
    const lastSection = form.values.sections[form.values.sections.length - 1];
    const lastGradeLevel = lastSection?.grade_level || 11;
    const lastSectionInGrade = form.values.sections
      .filter(s => s.grade_level === lastGradeLevel)
      .length;
    
    const nextSectionName = String.fromCharCode(65 + lastSectionInGrade); // A, B, C, etc.
    
    form.insertListItem('sections', {
      name: `${lastGradeLevel}${nextSectionName}`,
      grade_level: lastGradeLevel,
      student_count: 30,
      id: ''
    });
  };

  const removeSection = (index: number) => {
    form.removeListItem('sections', index);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // Insert or update sections
      for (const section of values.sections) {
        const sectionData = {
          name: section.name,
          grade_level: section.grade_level,
          student_count: section.student_count,
          school_id: schoolId,
          user_id: userId,
        };

        if (section.id) {
          // Update existing section
          const { error } = await supabase
            .from('class_sections')
            .update(sectionData)
            .eq('id', section.id);

          if (error) throw error;
        } else {
          // Create new section
          const { error } = await supabase
            .from('class_sections')
            .insert([sectionData]);

          if (error) throw error;
        }
      }

      // Delete removed sections
      const currentSectionIds = values.sections.map(s => s.id).filter(Boolean);
      const initialSectionIds = initialSections.map(s => s.id);
      const removedSectionIds = initialSectionIds.filter(id => !currentSectionIds.includes(id));

      if (removedSectionIds.length > 0) {
        const { error } = await supabase
          .from('class_sections')
          .delete()
          .in('id', removedSectionIds);

        if (error) throw error;
      }

      toast.success('Class sections saved successfully!');
      router.push('/admin/setup/subjects'); // Navigate to next setup step
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save class sections');
    }
  };

  return (
    <Container size="md">
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Stack>
          <Text size="sm" c="dimmed">
            Create class sections for your school. Each section represents a unique class group.
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {form.values.sections.map((section, index) => (
                <Card key={index} withBorder shadow="sm" p="md" radius="md">
                  <Group align="flex-start">
                    <Grid style={{ flex: 1 }} gutter="md">
                      <Grid.Col span={4}>
                        <TextInput
                          label="Section Name"
                          placeholder="e.g., 11A"
                          {...form.getInputProps(`sections.${index}.name`)}
                        />
                      </Grid.Col>
                      
                      <Grid.Col span={4}>
                        <NumberInput
                          label="Grade Level"
                          placeholder="Enter grade"
                          min={1}
                          max={12}
                          {...form.getInputProps(`sections.${index}.grade_level`)}
                        />
                      </Grid.Col>

                      <Grid.Col span={4}>
                        <NumberInput
                          label="Student Count"
                          placeholder="Number of students"
                          min={1}
                          {...form.getInputProps(`sections.${index}.student_count`)}
                        />
                      </Grid.Col>
                    </Grid>

                    {form.values.sections.length > 1 && (
                      <ActionIcon 
                        color="red" 
                        onClick={() => removeSection(index)}
                        variant="subtle"
                        size="lg"
                        mt={24}
                      >
                        <IconTrash size={20} />
                      </ActionIcon>
                    )}
                  </Group>
                </Card>
              ))}

              <Group justify="space-between">
                <Button 
                  variant="light" 
                  onClick={addSection}
                  leftSection={<IconPlus size={20} />}
                >
                  Add Section
                </Button>

                <Button type="submit">
                  Save & Continue
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Container>
  );
}
