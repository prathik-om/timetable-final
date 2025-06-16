export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      academic_years: {
        Row: {
          end_date: string;
          id: string;
          name: string;
          school_id: string;
          start_date: string;
        };
        Insert: {
          end_date: string;
          id?: string;
          name: string;
          school_id: string;
          start_date: string;
        };
        Update: {
          end_date?: string;
          id?: string;
          name?: string;
          school_id?: string;
          start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'academic_years_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
      api_room: {
        Row: {
          capacity: number;
          id: number;
          name: string;
        };
        Insert: {
          capacity: number;
          id?: number;
          name: string;
        };
        Update: {
          capacity?: number;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      class_offerings: {
        Row: {
          class_section_id: string;
          id: string;
          periods_per_week: number;
          subject_id: string;
          term_id: string;
          school_id: string;
        };
        Insert: {
          class_section_id: string;
          id?: string;
          periods_per_week: number;
          subject_id: string;
          term_id: string;
          school_id: string;
        };
        Update: {
          class_section_id?: string;
          id?: string;
          periods_per_week?: number;
          subject_id?: string;
          term_id?: string;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'class_offerings_class_section_id_fkey';
            columns: ['class_section_id'];
            isOneToOne: false;
            referencedRelation: 'class_sections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'class_offerings_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'class_offerings_term_id_fkey';
            columns: ['term_id'];
            isOneToOne: false;
            referencedRelation: 'terms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'class_offerings_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
      class_sections: {
        Row: {
          grade_level: number;
          id: string;
          name: string;
          school_id: string;
          student_count: number | null;
        };
        Insert: {
          grade_level: number;
          id?: string;
          name: string;
          school_id: string;
          student_count?: number | null;
        };
        Update: {
          grade_level?: number;
          id?: string;
          name?: string;
          school_id?: string;
          student_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'class_sections_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
      holidays: {
        Row: {
          date: string;
          id: string;
          reason: string;
          term_id: string;
        };
        Insert: {
          date: string;
          id?: string;
          reason: string;
          term_id: string;
        };
        Update: {
          date?: string;
          id?: string;
          reason?: string;
          term_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'holidays_term_id_fkey';
            columns: ['term_id'];
            isOneToOne: false;
            referencedRelation: 'terms';
            referencedColumns: ['id'];
          },
        ];
      };
      scheduled_lessons: {
        Row: {
          date: string;
          id: number;
          notes: string | null;
          status: string;
          substitute_teacher_id: string | null;
          teaching_assignment_id: string;
          timeslot_id: string;
        };
        Insert: {
          date: string;
          id?: number;
          notes?: string | null;
          status?: string;
          substitute_teacher_id?: string | null;
          teaching_assignment_id: string;
          timeslot_id: string;
        };
        Update: {
          date?: string;
          id?: number;
          notes?: string | null;
          status?: string;
          substitute_teacher_id?: string | null;
          teaching_assignment_id?: string;
          timeslot_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scheduled_lessons_substitute_teacher_id_fkey';
            columns: ['substitute_teacher_id'];
            isOneToOne: false;
            referencedRelation: 'teachers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scheduled_lessons_teaching_assignment_id_fkey';
            columns: ['teaching_assignment_id'];
            isOneToOne: false;
            referencedRelation: 'teaching_assignments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scheduled_lessons_timeslot_id_fkey';
            columns: ['timeslot_id'];
            isOneToOne: false;
            referencedRelation: 'time_slots';
            referencedColumns: ['id'];
          },
        ];
      };
      schedules: {
        Row: {
          created_at: string | null;
          id: string;
          room_id: string;
          subject_id: string;
          teacher_id: string;
          timeslot_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          room_id: string;
          subject_id: string;
          teacher_id: string;
          timeslot_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          room_id?: string;
          subject_id?: string;
          teacher_id?: string;
          timeslot_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      schools: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          board_affiliation: string | null;
          user_id: string | null;
          is_setup_complete: boolean;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          board_affiliation?: string | null;
          user_id?: string | null;
          is_setup_complete?: boolean;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          board_affiliation?: string | null;
          user_id?: string | null;
          is_setup_complete?: boolean;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          code: string | null;
          id: string;
          name: string;
          school_id: string;
          subject_type: string | null;
        };
        Insert: {
          code?: string | null;
          id?: string;
          name: string;
          school_id: string;
          subject_type?: string | null;
        };
        Update: {
          code?: string | null;
          id?: string;
          name?: string;
          school_id?: string;
          subject_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'subjects_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
      teacher_qualifications: {
        Row: {
          id: string;
          subject_id: string;
          teacher_id: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          teacher_id: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          teacher_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teacher_qualifications_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teacher_qualifications_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'teachers';
            referencedColumns: ['id'];
          },
        ];
      };
      teachers: {
        Row: {
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          school_id: string;
        };
        Insert: {
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          school_id: string;
        };
        Update: {
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teachers_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
      teaching_assignments: {
        Row: {
          class_offering_id: string;
          id: string;
          teacher_id: string;
        };
        Insert: {
          class_offering_id: string;
          id?: string;
          teacher_id: string;
        };
        Update: {
          class_offering_id?: string;
          id?: string;
          teacher_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teaching_assignments_class_offering_id_fkey';
            columns: ['class_offering_id'];
            isOneToOne: false;
            referencedRelation: 'class_offerings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teaching_assignments_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'teachers';
            referencedColumns: ['id'];
          },
        ];
      };
      terms: {
        Row: {
          academic_year_id: string;
          end_date: string;
          id: string;
          name: string;
          start_date: string;
        };
        Insert: {
          academic_year_id: string;
          end_date: string;
          id?: string;
          name: string;
          start_date: string;
        };
        Update: {
          academic_year_id?: string;
          end_date?: string;
          id?: string;
          name?: string;
          start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'terms_academic_year_id_fkey';
            columns: ['academic_year_id'];
            isOneToOne: false;
            referencedRelation: 'academic_years';
            referencedColumns: ['id'];
          },
        ];
      };
      time_slots: {
        Row: {
          day_of_week: number;
          end_time: string;
          id: string;
          is_teaching_period: boolean | null;
          school_id: string;
          slot_name: string | null;
          start_time: string;
        };
        Insert: {
          day_of_week: number;
          end_time: string;
          id?: string;
          is_teaching_period?: boolean | null;
          school_id: string;
          slot_name?: string | null;
          start_time: string;
        };
        Update: {
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_teaching_period?: boolean | null;
          school_id?: string;
          slot_name?: string | null;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'time_slots_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      day_of_week:
        | 'monday'
        | 'tuesday'
        | 'wednesday'
        | 'thursday'
        | 'friday'
        | 'saturday'
        | 'sunday';
      time_slot_type: 'lecture' | 'lab' | 'tutorial' | 'other';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      day_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      time_slot_type: ['lecture', 'lab', 'tutorial', 'other'],
    },
  },
} as const;
