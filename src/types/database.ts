export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      book_tags: {
        Row: {
          book_id: string
          tag: string
        }
        Insert: {
          book_id: string
          tag: string
        }
        Update: {
          book_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_tags_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          abandon_reason: string | null
          author: string | null
          category: string | null
          cover_url: string | null
          created_at: string | null
          current_duration_seconds: number | null
          current_page: number | null
          end_date: string | null
          estante_sort_order: number | null
          format: string | null
          id: string
          is_favorite: boolean | null
          is_priority: boolean
          is_recommended: boolean
          isbn: string | null
          language: string | null
          price: number | null
          priority_sort_order: number | null
          progress_percent: number | null
          purchase_date: string | null
          saga_id: string | null
          saga_sort_order: number | null
          start_date: string | null
          status: string
          title: string
          total_duration_seconds: number | null
          total_pages: number | null
          user_id: string
        }
        Insert: {
          abandon_reason?: string | null
          author?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          current_duration_seconds?: number | null
          current_page?: number | null
          end_date?: string | null
          estante_sort_order?: number | null
          format?: string | null
          id?: string
          is_favorite?: boolean | null
          is_priority?: boolean
          is_recommended?: boolean
          isbn?: string | null
          language?: string | null
          price?: number | null
          priority_sort_order?: number | null
          progress_percent?: number | null
          purchase_date?: string | null
          saga_id?: string | null
          saga_sort_order?: number | null
          start_date?: string | null
          status: string
          title: string
          total_duration_seconds?: number | null
          total_pages?: number | null
          user_id: string
        }
        Update: {
          abandon_reason?: string | null
          author?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          current_duration_seconds?: number | null
          current_page?: number | null
          end_date?: string | null
          estante_sort_order?: number | null
          format?: string | null
          id?: string
          is_favorite?: boolean | null
          is_priority?: boolean
          is_recommended?: boolean
          isbn?: string | null
          language?: string | null
          price?: number | null
          priority_sort_order?: number | null
          progress_percent?: number | null
          purchase_date?: string | null
          saga_id?: string | null
          saga_sort_order?: number | null
          start_date?: string | null
          status?: string
          title?: string
          total_duration_seconds?: number | null
          total_pages?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_saga_id_fkey"
            columns: ["saga_id"]
            isOneToOne: false
            referencedRelation: "sagas"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_ratings: {
        Row: {
          icon: string
          id: string
          label: string
          review_id: string
          value: number | null
        }
        Insert: {
          icon: string
          id?: string
          label: string
          review_id: string
          value?: number | null
        }
        Update: {
          icon?: string
          id?: string
          label?: string
          review_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_ratings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_quotes: {
        Row: {
          id: string
          quote_text: string
          review_id: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          quote_text: string
          review_id: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          quote_text?: string
          review_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "favorite_quotes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          currency: string | null
          has_seen_intro: boolean
          id: string
          is_deactivated: boolean
          nickname: string | null
          priority_list_name: string | null
          username: string
          username_changed_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: string | null
          has_seen_intro?: boolean
          id: string
          is_deactivated?: boolean
          nickname?: string | null
          priority_list_name?: string | null
          username: string
          username_changed_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: string | null
          has_seen_intro?: boolean
          id?: string
          is_deactivated?: boolean
          nickname?: string | null
          priority_list_name?: string | null
          username?: string
          username_changed_at?: string | null
        }
        Relationships: []
      }
      reading_goals: {
        Row: {
          created_at: string | null
          goal: number
          id: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          goal?: number
          id?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          goal?: number
          id?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      period_favorites: {
        Row: {
          book_id: string | null
          created_at: string | null
          id: string
          month: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          month?: number | null
          updated_at?: string | null
          user_id?: string
          year: number
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          month?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "period_favorites_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      releases: {
        Row: {
          author: string | null
          book_id: string | null
          created_at: string | null
          id: string
          place: string | null
          price: number | null
          release_date: string
          title: string
          user_id: string
        }
        Insert: {
          author?: string | null
          book_id?: string | null
          created_at?: string | null
          id?: string
          place?: string | null
          price?: number | null
          release_date: string
          title: string
          user_id?: string
        }
        Update: {
          author?: string | null
          book_id?: string | null
          created_at?: string | null
          id?: string
          place?: string | null
          price?: number | null
          release_date?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "releases_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      reading_history: {
        Row: {
          book_id: string
          created_at: string | null
          end_date: string
          id: string
          start_date: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          end_date: string
          id?: string
          start_date?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      reading_sessions: {
        Row: {
          id: string
          session_date: string
          user_id: string
        }
        Insert: {
          id?: string
          session_date: string
          user_id: string
        }
        Update: {
          id?: string
          session_date?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          book_id: string
          created_at: string | null
          favorite_character_name: string | null
          favorite_character_notes: string | null
          favorite_character_photo_url: string | null
          general_comments: string | null
          general_rating: number | null
          id: string
          recommends: boolean | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          favorite_character_name?: string | null
          favorite_character_notes?: string | null
          favorite_character_photo_url?: string | null
          general_comments?: string | null
          general_rating?: number | null
          id?: string
          recommends?: boolean | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          favorite_character_name?: string | null
          favorite_character_notes?: string | null
          favorite_character_photo_url?: string | null
          general_comments?: string | null
          general_rating?: number | null
          id?: string
          recommends?: boolean | null
          sort_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      sagas: {
        Row: {
          author: string | null
          category: string | null
          created_at: string | null
          estante_sort_order: number | null
          id: string
          is_favorite: boolean | null
          status: string | null
          title: string
          total_books: number | null
          user_id: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          estante_sort_order?: number | null
          id?: string
          is_favorite?: boolean | null
          status?: string | null
          title: string
          total_books?: number | null
          user_id: string
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          estante_sort_order?: number | null
          id?: string
          is_favorite?: boolean | null
          status?: string | null
          title?: string
          total_books?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_profile_extras: {
        Args: { target_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
