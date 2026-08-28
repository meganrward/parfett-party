export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string;
          display_name: string;
          is_super: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          is_super?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          is_super?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
          party_id: string;
          qr_code_id: string;
          rsvp_status: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
          party_id: string;
          qr_code_id: string;
          rsvp_status?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
          party_id?: string;
          qr_code_id?: string;
          rsvp_status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'guests_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: false;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'guests_qr_code_id_fkey';
            columns: ['qr_code_id'];
            isOneToOne: false;
            referencedRelation: 'qr_codes';
            referencedColumns: ['id'];
          },
        ];
      };
      parties: {
        Row: {
          alphabet: string;
          created_at: string;
          description: string | null;
          event_end: string | null;
          event_start: string | null;
          id: string;
          location: string | null;
          name: string;
          prefixes: string[];
          qr_count: number;
          slug: string;
          token_length: number;
        };
        Insert: {
          alphabet?: string;
          created_at?: string;
          description?: string | null;
          event_end?: string | null;
          event_start?: string | null;
          id?: string;
          location?: string | null;
          name: string;
          prefixes?: string[];
          qr_count?: number;
          slug: string;
          token_length?: number;
        };
        Update: {
          alphabet?: string;
          created_at?: string;
          description?: string | null;
          event_end?: string | null;
          event_start?: string | null;
          id?: string;
          location?: string | null;
          name?: string;
          prefixes?: string[];
          qr_count?: number;
          slug?: string;
          token_length?: number;
        };
        Relationships: [];
      };
      party_admins: {
        Row: {
          created_at: string;
          party_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          party_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          party_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'party_admins_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: false;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'party_admins_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'admins';
            referencedColumns: ['user_id'];
          },
        ];
      };
      qr_codes: {
        Row: {
          created_at: string;
          id: string;
          party_id: string;
          prefix: string | null;
          token: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          party_id: string;
          prefix?: string | null;
          token: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          party_id?: string;
          prefix?: string | null;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'qr_codes_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: false;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_guest: {
        Args: { p_name: string; p_status: string; p_token: string };
        Returns: string;
      };
      can_access: { Args: { p_party_id: string }; Returns: boolean };
      get_qr: {
        Args: { p_token: string };
        Returns: {
          description: string;
          event_end: string;
          event_start: string;
          found: boolean;
          guest_count: number;
          location: string;
          party_name: string;
          slug: string;
        }[];
      };
      is_super: { Args: never; Returns: boolean };
      list_guests: {
        Args: { p_token: string };
        Returns: {
          created_at: string;
          id: string;
          name: string;
          rsvp_status: string;
        }[];
      };
      update_guest: {
        Args: {
          p_guest_id: string;
          p_name: string;
          p_status: string;
          p_token: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
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
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
