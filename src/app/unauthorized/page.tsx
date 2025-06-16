'use client';

import { useRouter } from 'next/navigation';
import { Button, Container, Text, Title } from '@mantine/core';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <Container size="sm" py="xl">
      <Title order={1} ta="center" mb="lg">
        Access Denied
      </Title>
      <Text ta="center" mb="xl">
        You don't have permission to access this page. Please contact your school administrator if
        you believe this is an error.
      </Text>
      <Button fullWidth onClick={() => router.push('/')}>
        Return to Home
      </Button>
    </Container>
  );
}
