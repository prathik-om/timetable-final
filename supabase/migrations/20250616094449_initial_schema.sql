-- Drop all existing tables in the correct order
DROP TABLE IF EXISTS public.scheduled_lessons CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.teaching_assignments CASCADE;
DROP TABLE IF EXISTS public.class_offerings CASCADE;
DROP TABLE IF EXISTS public.time_slots CASCADE;
DROP TABLE IF EXISTS public.teacher_qualifications CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.class_sections CASCADE;
DROP TABLE IF EXISTS public.holidays CASCADE;
DROP TABLE IF EXISTS public.terms CASCADE;
DROP TABLE IF EXISTS public.academic_years CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;

-- Create core tables
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  board_affiliation text,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  is_setup_complete boolean NOT NULL DEFAULT FALSE,
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);

CREATE TABLE public.academic_years (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  user_id uuid,
  CONSTRAINT academic_years_pkey PRIMARY KEY (id),
  CONSTRAINT academic_years_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);

CREATE TABLE public.terms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  user_id uuid,
  CONSTRAINT terms_pkey PRIMARY KEY (id),
  CONSTRAINT terms_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT terms_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
);

CREATE TABLE public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  term_id uuid NOT NULL,
  date date NOT NULL,
  reason text NOT NULL,
  CONSTRAINT holidays_pkey PRIMARY KEY (id),
  CONSTRAINT holidays_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT holidays_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id),
  CONSTRAINT holidays_school_date_unique UNIQUE (school_id, date)
);

CREATE TABLE public.class_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  grade_level integer NOT NULL,
  name text NOT NULL,
  student_count integer DEFAULT 30,
  user_id uuid,
  CONSTRAINT class_sections_pkey PRIMARY KEY (id),
  CONSTRAINT class_sections_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);

CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  subject_type text,
  required_room_type text,
  user_id uuid,
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT subjects_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);

CREATE TABLE public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  user_id uuid,
  CONSTRAINT teachers_pkey PRIMARY KEY (id),
  CONSTRAINT teachers_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT teachers_school_email_unique UNIQUE (school_id, email)
);

CREATE TABLE public.teacher_qualifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  user_id uuid,
  CONSTRAINT teacher_qualifications_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_qualifications_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT teacher_qualifications_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT teacher_qualifications_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);

CREATE TABLE public.time_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_teaching_period boolean DEFAULT true,
  slot_name text,
  user_id uuid,
  CONSTRAINT time_slots_pkey PRIMARY KEY (id),
  CONSTRAINT time_slots_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);

CREATE TABLE public.class_offerings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  term_id uuid NOT NULL,
  class_section_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  periods_per_week integer NOT NULL,
  user_id uuid,
  CONSTRAINT class_offerings_pkey PRIMARY KEY (id),
  CONSTRAINT class_offerings_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT class_offerings_class_section_id_fkey FOREIGN KEY (class_section_id) REFERENCES public.class_sections(id),
  CONSTRAINT class_offerings_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT class_offerings_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id)
);

CREATE TABLE public.teaching_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  class_offering_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  user_id uuid,
  CONSTRAINT teaching_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT teaching_assignments_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT teaching_assignments_class_offering_id_fkey FOREIGN KEY (class_offering_id) REFERENCES public.class_offerings(id),
  CONSTRAINT teaching_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);

CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  offering_id uuid NOT NULL,
  class_section_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  subject_name text NOT NULL,
  time_slot_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT lessons_offering_id_fkey FOREIGN KEY (offering_id) REFERENCES public.class_offerings(id),
  CONSTRAINT lessons_class_section_id_fkey FOREIGN KEY (class_section_id) REFERENCES public.class_sections(id),
  CONSTRAINT lessons_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT lessons_time_slot_id_fkey FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id)
);

-- Create sequence for scheduled lessons
CREATE SEQUENCE IF NOT EXISTS scheduled_lessons_id_seq;

CREATE TABLE public.scheduled_lessons (
  id bigint NOT NULL DEFAULT nextval('scheduled_lessons_id_seq'::regclass),
  school_id uuid NOT NULL,
  teaching_assignment_id uuid NOT NULL,
  room_id uuid,
  date date NOT NULL,
  timeslot_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'Scheduled'::text,
  substitute_teacher_id uuid,
  notes text,
  user_id uuid,
  CONSTRAINT scheduled_lessons_pkey PRIMARY KEY (id),
  CONSTRAINT scheduled_lessons_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT scheduled_lessons_substitute_teacher_id_fkey FOREIGN KEY (substitute_teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT scheduled_lessons_teaching_assignment_id_fkey FOREIGN KEY (teaching_assignment_id) REFERENCES public.teaching_assignments(id),
  CONSTRAINT scheduled_lessons_timeslot_id_fkey FOREIGN KEY (timeslot_id) REFERENCES public.time_slots(id)
);

-- Create indexes
CREATE INDEX idx_academic_years_school_id ON public.academic_years (school_id);
CREATE INDEX idx_academic_years_school_dates ON public.academic_years (school_id, start_date, end_date);
CREATE INDEX idx_terms_school_id ON public.terms (school_id);
CREATE INDEX idx_terms_school_academic_year ON public.terms (school_id, academic_year_id);
CREATE INDEX idx_terms_school_dates ON public.terms (school_id, start_date, end_date);
CREATE INDEX idx_holidays_school_id ON public.holidays (school_id);
CREATE INDEX idx_holidays_school_term ON public.holidays (school_id, term_id);
CREATE INDEX idx_holidays_school_date ON public.holidays (school_id, date);
CREATE INDEX idx_class_sections_school_id ON public.class_sections (school_id);
CREATE INDEX idx_class_sections_school_grade ON public.class_sections (school_id, grade_level);
CREATE INDEX idx_subjects_school_id ON public.subjects (school_id);
CREATE INDEX idx_subjects_school_code ON public.subjects (school_id, code) WHERE code IS NOT NULL;
CREATE INDEX idx_subjects_school_type ON public.subjects (school_id, subject_type) WHERE subject_type IS NOT NULL;
CREATE INDEX idx_teachers_school_id ON public.teachers (school_id);
CREATE INDEX idx_teachers_school_name ON public.teachers (school_id, last_name, first_name);
CREATE INDEX idx_teacher_qualifications_school_id ON public.teacher_qualifications (school_id);
CREATE INDEX idx_teacher_qualifications_school_teacher ON public.teacher_qualifications (school_id, teacher_id);
CREATE INDEX idx_teacher_qualifications_school_subject ON public.teacher_qualifications (school_id, subject_id);
CREATE INDEX idx_time_slots_school_id ON public.time_slots (school_id);
CREATE INDEX idx_time_slots_school_day ON public.time_slots (school_id, day_of_week);
CREATE INDEX idx_time_slots_school_teaching ON public.time_slots (school_id, is_teaching_period) WHERE is_teaching_period = true;
CREATE INDEX idx_class_offerings_school_id ON public.class_offerings (school_id);
CREATE INDEX idx_class_offerings_school_term ON public.class_offerings (school_id, term_id);
CREATE INDEX idx_class_offerings_school_section ON public.class_offerings (school_id, class_section_id);
CREATE INDEX idx_class_offerings_school_subject ON public.class_offerings (school_id, subject_id);
CREATE INDEX idx_teaching_assignments_school_id ON public.teaching_assignments (school_id);
CREATE INDEX idx_teaching_assignments_school_teacher ON public.teaching_assignments (school_id, teacher_id);
CREATE INDEX idx_teaching_assignments_school_offering ON public.teaching_assignments (school_id, class_offering_id);
CREATE INDEX idx_lessons_school_id ON public.lessons (school_id);
CREATE INDEX idx_lessons_school_teacher ON public.lessons (school_id, teacher_id);
CREATE INDEX idx_lessons_school_section ON public.lessons (school_id, class_section_id);
CREATE INDEX idx_lessons_school_created ON public.lessons (school_id, created_at);
CREATE INDEX idx_scheduled_lessons_school_id ON public.scheduled_lessons (school_id);
CREATE INDEX idx_scheduled_lessons_school_date ON public.scheduled_lessons (school_id, date);
CREATE INDEX idx_scheduled_lessons_school_assignment ON public.scheduled_lessons (school_id, teaching_assignment_id);
CREATE INDEX idx_scheduled_lessons_school_timeslot ON public.scheduled_lessons (school_id, timeslot_id);
CREATE INDEX idx_scheduled_lessons_school_status ON public.scheduled_lessons (school_id, status);

-- Enable Row Level Security
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_lessons ENABLE ROW LEVEL SECURITY;