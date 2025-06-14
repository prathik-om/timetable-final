'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Container, Title, SimpleGrid, Card, Text, Button, Group, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { IconSchool, IconUsers, IconBook, IconDoor } from '@tabler/icons-react';

type School = {
  id: string;
  name: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchool = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSchool(schoolData);
      setLoading(false);
    };

    fetchSchool();
  }, [router, supabase]);

  const adminFeatures = [
    {
      title: 'School Profile',
      description: 'Manage your school information and settings',
      icon: <IconSchool size={24} />,
      path: '/admin/school-profile',
    },
    {
      title: 'Teachers',
      description: 'Manage teachers and their qualifications',
      icon: <IconUsers size={24} />,
      path: '/admin/teachers',
    },
    {
      title: 'Teaching Assignments',
      description: 'Assign teachers to classes and manage schedules',
      icon: <IconBook size={24} />,
      path: '/admin/teaching-assignments',
    },
    {
      title: 'Rooms',
      description: 'Manage classrooms and facilities',
      icon: <IconDoor size={24} />,
      path: '/admin/rooms',
    },
  ];

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Group position="apart" align="center">
          <div>
            <Title order={1}>Admin Dashboard</Title>
            {school && (
              <Text color="dimmed" size="lg">
                {school.name}
              </Text>
            )}
          </div>
          <Button
            variant="light"
            onClick={() => {
              supabase.auth.signOut();
              router.push('/login');
            }}
          >
            Sign Out
          </Button>
        </Group>

        <SimpleGrid cols={2} spacing="lg">
          {adminFeatures.map((feature) => (
            <Card key={feature.path} shadow="sm" p="lg" radius="md" withBorder>
              <Group position="apart" mb="md">
                {feature.icon}
                <Title order={3}>{feature.title}</Title>
              </Group>
              <Text size="sm" color="dimmed" mb="xl">
                {feature.description}
              </Text>
              <Button
                variant="light"
                fullWidth
                onClick={() => router.push(feature.path)}
              >
                Manage
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
} 