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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          label: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          id: string
          label: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      meal_section_recipes: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          section_id: string
          servings_override: number | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          section_id: string
          servings_override?: number | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          section_id?: string
          servings_override?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_section_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_section_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_section_recipes_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "meal_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_sections: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_sections_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_calendar_events: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          sort_order: number
          time_display: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string
          id?: string
          sort_order?: number
          time_display?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          sort_order?: number
          time_display?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_calendar_notes: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          expiration_date: string | null
          id: string
          location: string
          min_quantity: number
          name: string
          notes: string | null
          quantity: number
          tags: string[] | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          location?: string
          min_quantity?: number
          name: string
          notes?: string | null
          quantity?: number
          tags?: string[] | null
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          location?: string
          min_quantity?: number
          name?: string
          notes?: string | null
          quantity?: number
          tags?: string[] | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          cook_time: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: string[]
          is_public: boolean | null
          name: string
          prep_time: number | null
          servings: number | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cook_time?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string[]
          is_public?: boolean | null
          name: string
          prep_time?: number | null
          servings?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cook_time?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string[]
          is_public?: boolean | null
          name?: string
          prep_time?: number | null
          servings?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shabbat_default_recipes: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          section_id: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          section_id: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          section_id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shabbat_default_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shabbat_default_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shabbat_default_recipes_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "shabbat_default_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      shabbat_default_sections: {
        Row: {
          created_at: string
          id: string
          name: string
          slot: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slot: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slot?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shabbat_dish_assignments: {
        Row: {
          created_at: string
          id: string
          person: string
          plan_id: string
          round: string
          sink: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          person?: string
          plan_id: string
          round: string
          sink: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          person?: string
          plan_id?: string
          round?: string
          sink?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shabbat_dish_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "shabbat_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      shabbat_extra_recipes: {
        Row: {
          assigned_to: string
          created_at: string
          custom_name: string | null
          id: string
          is_done: boolean
          plan_id: string
          recipe_id: string | null
          sort_order: number
        }
        Insert: {
          assigned_to?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_done?: boolean
          plan_id: string
          recipe_id?: string | null
          sort_order?: number
        }
        Update: {
          assigned_to?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_done?: boolean
          plan_id?: string
          recipe_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "shabbat_extra_recipes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "shabbat_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shabbat_extra_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shabbat_extra_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shabbat_plan_sections: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_id: string
          slot: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_id: string
          slot: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_id?: string
          slot?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "shabbat_plan_sections_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "shabbat_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      shabbat_plans: {
        Row: {
          created_at: string
          friday_meal_id: string | null
          id: string
          saturday_meal_id: string | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          friday_meal_id?: string | null
          id?: string
          saturday_meal_id?: string | null
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          friday_meal_id?: string | null
          id?: string
          saturday_meal_id?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "shabbat_plans_friday_meal_id_fkey"
            columns: ["friday_meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shabbat_plans_saturday_meal_id_fkey"
            columns: ["saturday_meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      shabbat_section_recipes: {
        Row: {
          assigned_to: string
          created_at: string
          custom_name: string | null
          id: string
          is_done: boolean
          recipe_id: string | null
          section_id: string
          sort_order: number
        }
        Insert: {
          assigned_to?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_done?: boolean
          recipe_id?: string | null
          section_id: string
          sort_order?: number
        }
        Update: {
          assigned_to?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_done?: boolean
          recipe_id?: string | null
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "shabbat_section_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shabbat_section_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shabbat_section_recipes_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "shabbat_plan_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          added_at: string
          category: string | null
          checked: boolean
          id: string
          name: string
          product_id: string | null
          quantity: number
          unit: string
          user_id: string
        }
        Insert: {
          added_at?: string
          category?: string | null
          checked?: boolean
          id?: string
          name: string
          product_id?: string | null
          quantity?: number
          unit?: string
          user_id: string
        }
        Update: {
          added_at?: string
          category?: string | null
          checked?: boolean
          id?: string
          name?: string
          product_id?: string | null
          quantity?: number
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_meal_plans: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weekly_plan_day_notes: {
        Row: {
          content: string
          created_at: string
          day_of_week: number
          id: string
          note_type: string
          plan_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          day_of_week: number
          id?: string
          note_type: string
          plan_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          day_of_week?: number
          id?: string
          note_type?: string
          plan_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plan_day_notes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plan_slots: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          meal_id: string | null
          meal_type: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          meal_id?: string | null
          meal_type: string
          plan_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          meal_id?: string | null
          meal_type?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plan_slots_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_plan_slots_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_slot_recipes: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          meal_type: string
          plan_id: string
          recipe_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          meal_type: string
          plan_id: string
          recipe_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          meal_type?: string
          plan_id?: string
          recipe_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_slot_recipes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_slot_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_slot_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      recipes_public: {
        Row: {
          cook_time: number | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          ingredients: Json | null
          instructions: string[] | null
          is_public: boolean | null
          name: string | null
          prep_time: number | null
          servings: number | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cook_time?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string[] | null
          is_public?: boolean | null
          name?: string | null
          prep_time?: number | null
          servings?: number | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: never
        }
        Update: {
          cook_time?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string[] | null
          is_public?: boolean | null
          name?: string | null
          prep_time?: number | null
          servings?: number | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: never
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product_category:
        | "dairy"
        | "meat"
        | "vegetables"
        | "fruits"
        | "grains"
        | "frozen"
        | "beverages"
        | "condiments"
        | "snacks"
        | "other"
      storage_location: "fridge" | "freezer" | "pantry" | "counter"
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
  public: {
    Enums: {
      product_category: [
        "dairy",
        "meat",
        "vegetables",
        "fruits",
        "grains",
        "frozen",
        "beverages",
        "condiments",
        "snacks",
        "other",
      ],
      storage_location: ["fridge", "freezer", "pantry", "counter"],
    },
  },
} as const
