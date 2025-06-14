export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      teachers: {
        Row: {
          id: string;
          created_at: string;
          first_name: string;
          last_name: string;
          email: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          first_name: string;
          last_name: string;
          email: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
        };
        Relationships: [];
      };
      schools: {
        Row: {
          id: string;
          created_at: string;
          name: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          code: string;
          subject_type: string;
          school_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          code: string;
          subject_type: string;
          school_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          code?: string;
          subject_type?: string;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subjects_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          }
        ];
      };
      rooms: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          capacity: number;
          room_type: string;
          school_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          capacity: number;
          room_type: string;
          school_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          capacity?: number;
          room_type?: string;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rooms_school_id_fkey';
            columns: ['school_id'];
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          }
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
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
} 