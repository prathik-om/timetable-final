'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { Database } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';

type TimeSlot = Database['public']['Tables']['time_slots']['Row'];

type TimeSlotsClientUIProps = {
  initialTimeSlots: TimeSlot[];
  schoolId: string;
};

const DAYS_OF_WEEK = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
];

export default function TimeSlotsClientUI({ initialTimeSlots, schoolId }: TimeSlotsClientUIProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      day_of_week: '',
      start_time: '',
      end_time: '',
      is_teaching_period: true,
      slot_name: '',
    },
    validate: {
      day_of_week: (value) => (!value ? 'Day of week is required' : null),
      start_time: (value) => (!value ? 'Start time is required' : null),
      end_time: (value) => (!value ? 'End time is required' : null),
      slot_name: (value, values) =>
        !values.is_teaching_period && !value
          ? 'Slot name is required for non-teaching periods'
          : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    const timeSlotData = {
      ...values,
      day_of_week: parseInt(values.day_of_week),
      school_id: schoolId,
    };

    const promise = selectedTimeSlot
      ? supabase.from('time_slots').update(timeSlotData).eq('id', selectedTimeSlot.id)
      : supabase.from('time_slots').insert(timeSlotData);

    toast.promise(
      async () => {
        const { error } = await promise;
        if (error) throw error;
        router.refresh();
        setIsModalOpen(false);
        setSelectedTimeSlot(null);
        form.reset();
      },
      {
        loading: 'Saving time slot...',
        success: 'Time slot saved successfully!',
        error: 'Error saving time slot.',
      }
    );
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    toast.promise(
      async () => {
        const { error } = await supabase.from('time_slots').delete().eq('id', deleteId);
        if (error) throw error;
        router.refresh();
        setIsDeleteModalOpen(false);
        setDeleteId(null);
      },
      {
        loading: 'Deleting time slot...',
        success: 'Time slot deleted successfully!',
        error: 'Error deleting time slot.',
      }
    );
  };

  // Group time slots by day
  const timeSlotsByDay = initialTimeSlots.reduce(
    (acc, slot) => {
      const day =
        DAYS_OF_WEEK.find((d) => d.value === slot.day_of_week.toString())?.label || 'Unknown';
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(slot);
      return acc;
    },
    {} as Record<string, TimeSlot[]>
  );

  return (
    <Stack>
      <Group justify="flex-end">
        <Button onClick={() => setIsModalOpen(true)}>Add New Time Slot</Button>
      </Group>

      {Object.entries(timeSlotsByDay).map(([day, slots]) => (
        <Card key={day} shadow="sm" withBorder>
          <Text size="lg" fw={500} mb="md">
            {day}
          </Text>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Slot Type</Table.Th>
                <Table.Th>Start Time</Table.Th>
                <Table.Th>End Time</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {slots
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((slot) => (
                  <Table.Tr key={slot.id}>
                    <Table.Td>
                      {slot.is_teaching_period ? 'Teaching Period' : slot.slot_name}
                    </Table.Td>
                    <Table.Td>{slot.start_time}</Table.Td>
                    <Table.Td>{slot.end_time}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          onClick={() => {
                            setSelectedTimeSlot(slot);
                            form.setValues({
                              day_of_week: slot.day_of_week.toString(),
                              start_time: slot.start_time,
                              end_time: slot.end_time,
                              is_teaching_period: slot.is_teaching_period ?? undefined,
                              slot_name: slot.slot_name || '',
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
                          onClick={() => handleDelete(slot.id)}
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
      ))}

      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTimeSlot(null);
          form.reset();
        }}
        title={selectedTimeSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Day of Week"
              placeholder="Select a day"
              data={DAYS_OF_WEEK}
              {...form.getInputProps('day_of_week')}
            />
            <TimeInput
              label="Start Time"
              placeholder="Select start time"
              {...form.getInputProps('start_time')}
            />
            <TimeInput
              label="End Time"
              placeholder="Select end time"
              {...form.getInputProps('end_time')}
            />
            <Checkbox
              label="Is this a teaching period?"
              {...form.getInputProps('is_teaching_period', { type: 'checkbox' })}
            />
            {!form.values.is_teaching_period && (
              <TextInput
                label="Custom Slot Name"
                placeholder="Enter slot name (e.g., Lunch Break)"
                {...form.getInputProps('slot_name')}
              />
            )}
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
        <Text mb="xl">Are you sure you want to delete this time slot?</Text>
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
