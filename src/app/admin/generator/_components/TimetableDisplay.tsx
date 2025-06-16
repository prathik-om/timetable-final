'use client';

import React, { useMemo } from 'react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { IconRotate } from '@tabler/icons-react';
import { toast } from 'sonner';
import { ActionIcon, Card, Group, Text, Title } from '@mantine/core';

interface TimetableEntry {
  class_section_name: string;
  day: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  teacher_name: string;
  lesson_id: string;
}

interface TimetableDisplayProps {
  timetable: TimetableEntry[];
  onEventUpdate?: (lessonId: string, newDay: number, newStartTime: string) => Promise<void>;
}

// Generate a consistent color for a string (subject, teacher, or class)
function stringToColor(str: string, saturation = 70, lightness = 60): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export default function TimetableDisplay({ timetable, onEventUpdate }: TimetableDisplayProps) {
  // Transform timetable entries into FullCalendar events with consistent colors
  const events = useMemo(() => {
    return timetable.map((entry) => {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + entry.day);

      const startDateTime = new Date(date.toDateString() + ' ' + entry.start_time);
      const endDateTime = new Date(date.toDateString() + ' ' + entry.end_time);

      // Generate consistent colors based on subject
      const backgroundColor = stringToColor(entry.subject_name);
      const borderColor = stringToColor(entry.subject_name, 70, 55);

      return {
        id: entry.lesson_id, // This is now a valid database UUID
        title: entry.subject_name,
        start: startDateTime,
        end: endDateTime,
        extendedProps: {
          teacher: entry.teacher_name,
          class: entry.class_section_name,
          subject: entry.subject_name,
          originalDay: entry.day,
          originalStart: entry.start_time,
          lessonId: entry.lesson_id, // Store the UUID here as well for clarity
        },
        backgroundColor,
        borderColor,
        textColor: 'white',
        editable: true,
      };
    });
  }, [timetable]);

  const handleEventDrop = async (dropInfo: any) => {
    const { event } = dropInfo;

    // Get the new day and time
    const newStart = event.start;
    const newDay = newStart.getDay() || 7; // Convert Sunday (0) to 7
    const newStartTime = newStart.toTimeString().split(' ')[0].substring(0, 5);

    // If no changes, return
    if (
      newDay === event.extendedProps.originalDay &&
      newStartTime === event.extendedProps.originalStart
    ) {
      return;
    }

    try {
      if (onEventUpdate) {
        await onEventUpdate(event.id, newDay, newStartTime);
        toast.success('Schedule updated successfully');
      }
    } catch (error: any) {
      // Revert the drop
      dropInfo.revert();
      toast.error(error.message || 'Failed to update schedule');
      console.error('Update error:', error);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder mt="lg">
      <Group justify="space-between" mb="md">
        <Title order={3}>Weekly Timetable</Title>
        <ActionIcon
          variant="outline"
          onClick={() => {
            const calendarApi = document
              .querySelector('.fc')
              ?.getElementsByClassName('fc-toolbar-chunk')[0]
              ?.getElementsByClassName('fc-today-button')[0] as HTMLButtonElement;
            if (calendarApi) calendarApi.click();
          }}
          title="Reset view to current week"
        >
          <IconRotate size={16} />
        </ActionIcon>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        Drag and drop classes to adjust the schedule. Changes will be saved automatically.
      </Text>
      <div className="h-[700px] bg-white rounded-lg">
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          events={events}
          editable={true}
          slotEventOverlap={false}
          eventDrop={handleEventDrop}
          slotMinTime="08:00:00"
          slotMaxTime="17:00:00"
          allDaySlot={false}
          weekends={false}
          expandRows={true}
          stickyHeaderDates={true}
          dayHeaderClassNames="bg-gray-100 text-gray-700 font-semibold py-2"
          slotLaneClassNames="bg-gray-50"
          nowIndicator={true}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          eventContent={(eventInfo) => (
            <div className="p-1 text-xs overflow-hidden whitespace-normal">
              <div className="font-bold">{eventInfo.event.title}</div>
              <div>{eventInfo.event.extendedProps.class}</div>
              <div className="text-gray-100">{eventInfo.event.extendedProps.teacher}</div>
            </div>
          )}
          eventClassNames="overflow-hidden hover:shadow-lg transition-shadow"
          eventDidMount={(info) => {
            info.el.title = `${info.event.extendedProps.subject}\n${info.event.extendedProps.class}\n${info.event.extendedProps.teacher}`;
          }}
        />
      </div>
    </Card>
  );
}
