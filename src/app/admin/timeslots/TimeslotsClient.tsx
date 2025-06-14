'use client';

import { supabase } from '@/lib/supabaseClient';
import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import React, { useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';

// Define the type for a single time slot based on your schema
export type TimeSlot = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_teaching_period: boolean;
  slot_name: string | null;
  school_id: string; // school_id is a UUID (string)
};

// Helper to get day name from number
const dayOfWeekMap: { [key: number]: string } = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

// ##################################
// ## CLIENT COMPONENT
// ##################################
export function TimeslotsClientComponent({
  initialTimeslots,
  schoolId,
}: {
  initialTimeslots: TimeSlot[];
  schoolId: string;
}) {
  const [slots, setSlots] = useState(initialTimeslots);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<TimeSlot | null>(null);

  const [isModalOpen, modalHandlers] = useDisclosure(false);
  const [isAlertOpen, alertHandlers] = useDisclosure(false);

  const form = useForm<Omit<TimeSlot, 'id' | 'school_id'>>({
    initialValues: {
      day_of_week: 1,
      start_time: '',
      end_time: '',
      is_teaching_period: true,
      slot_name: '',
    },
    validate: {
      start_time: (value) => (value ? null : 'Start time is required'),
      end_time: (value, values) => {
        if (!value) return 'End time is required';
        if (value <= values.start_time) return 'End time must be after start time';
        return null;
      },
      slot_name: (value, values) =>
        !values.is_teaching_period && !value
          ? 'Custom slot name is required for non-teaching periods'
          : null,
    },
  });

  const handleAddNew = () => {
    setEditingSlot(null);
    form.reset();
    modalHandlers.open();
  };

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    form.setValues({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_teaching_period: slot.is_teaching_period,
      slot_name: slot.slot_name || '',
    });
    modalHandlers.open();
  };

  const handleDeleteClick = (slot: TimeSlot) => {
    setSlotToDelete(slot);
    alertHandlers.open();
  };

  const confirmDelete = async () => {
    if (!slotToDelete) return;

    const { error } = await supabase.from('time_slots').delete().eq('id', slotToDelete.id);
    if (error) {
      toast.error(`Failed to delete slot: ${error.message}`);
    } else {
      setSlots(slots.filter((s) => s.id !== slotToDelete.id));
      toast.success('Time slot deleted successfully!');
    }
    alertHandlers.close();
    setSlotToDelete(null);
  };

  const handleSubmit = async (values: typeof form.values) => {
    const slotData = {
      ...values,
      slot_name: values.is_teaching_period ? null : values.slot_name,
    };

    if (editingSlot) {
      // Update
      const { data, error } = await supabase
        .from('time_slots')
        .update(slotData)
        .eq('id', editingSlot.id)
        .select()
        .single();
      if (error) {
        toast.error(`Failed to update slot: ${error.message}`);
      } else if (data) {
        setSlots(slots.map((s) => (s.id === editingSlot.id ? data : s)));
        toast.success('Time slot updated successfully!');
        modalHandlers.close();
      }
    } else {
      // Create
      const { data, error } = await supabase
        .from('time_slots')
        .insert({ ...slotData, school_id: schoolId })
        .select()
        .single();
      if (error) {
        toast.error(`Failed to create slot: ${error.message}`);
      } else if (data) {
        setSlots([...slots, data]);
        toast.success('Time slot created successfully!');
        modalHandlers.close();
      }
    }
  };

  const groupedSlots = useMemo(() => {
    const groups: { [key: string]: TimeSlot[] } = {};
    slots.forEach((slot) => {
      const dayName = dayOfWeekMap[slot.day_of_week];
      if (!groups[dayName]) {
        groups[dayName] = [];
      }
      groups[dayName].push(slot);
    });
    // Sort slots within each group by start time
    for (const dayName in groups) {
      groups[dayName].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return groups;
  }, [slots]);

  const sortedDays = Object.keys(groupedSlots).sort((a, b) => {
    const dayA = Object.keys(dayOfWeekMap).find((key) => dayOfWeekMap[parseInt(key)] === a);
    const dayB = Object.keys(dayOfWeekMap).find((key) => dayOfWeekMap[parseInt(key)] === b);
    return parseInt(dayA!) - parseInt(dayB!);
  });

  return (
    <Container my="md">
      <Toaster richColors />
      <Group justify="space-between" mb="lg">
        <Title order={1}>Weekly Time Slot Template</Title>
        <Button onClick={handleAddNew}>Add New Time Slot</Button>
      </Group>

      <Stack>
        {sortedDays.map((dayName) => (
          <Card key={dayName} shadow="sm" p="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Title order={3}>{dayName}</Title>
            </Card.Section>
            <Table mt="md" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Slot Type</Table.Th>
                  <Table.Th>Start Time</Table.Th>
                  <Table.Th>End Time</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {groupedSlots[dayName].map((slot) => (
                  <Table.Tr key={slot.id}>
                    <Table.Td>
                      {slot.is_teaching_period ? 'Teaching Period' : slot.slot_name}
                    </Table.Td>
                    <Table.Td>{slot.start_time}</Table.Td>
                    <Table.Td>{slot.end_time}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="light" onClick={() => handleEdit(slot)}>
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteClick(slot)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        ))}
      </Stack>

      {/* Add/Edit Modal */}
      <Modal
        opened={isModalOpen}
        onClose={modalHandlers.close}
        title={editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Day of the Week"
              placeholder="Select a day"
              data={Object.entries(dayOfWeekMap).map(([value, label]) => ({ value, label }))}
              {...form.getInputProps('day_of_week')}
              required
            />
            <Group grow>
              <TimeInput label="Start Time" {...form.getInputProps('start_time')} required />
              <TimeInput label="End Time" {...form.getInputProps('end_time')} required />
            </Group>
            <Checkbox
              label="Is this a teaching period?"
              {...form.getInputProps('is_teaching_period', { type: 'checkbox' })}
            />
            {!form.values.is_teaching_period && (
              <TextInput
                label="Custom Slot Name"
                placeholder="e.g., Lunch Break"
                {...form.getInputProps('slot_name')}
                required
              />
            )}
            <Group justify="flex-end" mt="md">
              <Button type="submit">Save Changes</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal opened={isAlertOpen} onClose={alertHandlers.close} title="Confirm Deletion">
        <Text>Are you sure you want to delete this time slot? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={alertHandlers.close}>Cancel</Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
} 