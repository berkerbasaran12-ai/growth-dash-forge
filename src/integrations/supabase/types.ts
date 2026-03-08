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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      ad_platform_connections: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          id: string
          is_active: boolean
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_notes: {
        Row: {
          admin_user_id: string
          client_user_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          admin_user_id: string
          client_user_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          admin_user_id?: string
          client_user_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      client_payments: {
        Row: {
          amount: number
          client_user_id: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_date: string
          service_id: string | null
          status: string
        }
        Insert: {
          amount?: number
          client_user_id: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_date?: string
          service_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_user_id?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_date?: string
          service_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "client_services"
            referencedColumns: ["id"]
          },
        ]
      }
      client_services: {
        Row: {
          amount: number
          billing_cycle: string
          client_user_id: string
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          service_name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          client_user_id: string
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          service_name: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          client_user_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          service_name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          type?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      kb_category_access: {
        Row: {
          category_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_category_access_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_content: {
        Row: {
          category_id: string | null
          content_type: string
          content_url: string | null
          created_at: string
          description: string
          id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_metrics: {
        Row: {
          channel: string
          conversions: number
          cpc: number
          cpm: number
          created_at: string
          date: string
          engagement_rate: number
          id: string
          leads: number
          roas: number
          spend: number
          traffic: number
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          date: string
          engagement_rate?: number
          id?: string
          leads?: number
          roas?: number
          spend?: number
          traffic?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          date?: string
          engagement_rate?: number
          id?: string
          leads?: number
          roas?: number
          spend?: number
          traffic?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_goals: {
        Row: {
          created_at: string
          goals: Json
          id: string
          is_locked: boolean
          month: string
          target_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goals?: Json
          id?: string
          is_locked?: boolean
          month: string
          target_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goals?: Json
          id?: string
          is_locked?: boolean
          month?: string
          target_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      salary_records: {
        Row: {
          amount: number
          created_at: string
          employee_name: string
          id: string
          month: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          employee_name: string
          id?: string
          month: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          employee_name?: string
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_goals: {
        Row: {
          created_at: string
          id: string
          month: string
          target_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          target_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          target_sales?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_metrics: {
        Row: {
          appointments: number
          avg_cart_value: number | null
          avg_deal_value: number
          churn_rate: number
          created_at: string
          date: string
          id: string
          leads_received: number
          ltv: number
          net_profit: number
          new_customers: number
          order_count: number
          returning_customers: number
          total_sales: number
          updated_at: string
          user_id: string
          win_rate: number
        }
        Insert: {
          appointments?: number
          avg_cart_value?: number | null
          avg_deal_value?: number
          churn_rate?: number
          created_at?: string
          date: string
          id?: string
          leads_received?: number
          ltv?: number
          net_profit?: number
          new_customers?: number
          order_count?: number
          returning_customers?: number
          total_sales?: number
          updated_at?: string
          user_id: string
          win_rate?: number
        }
        Update: {
          appointments?: number
          avg_cart_value?: number | null
          avg_deal_value?: number
          churn_rate?: number
          created_at?: string
          date?: string
          id?: string
          leads_received?: number
          ltv?: number
          net_profit?: number
          new_customers?: number
          order_count?: number
          returning_customers?: number
          total_sales?: number
          updated_at?: string
          user_id?: string
          win_rate?: number
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          client_user_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          permission: string
          status: string
          token: string
        }
        Insert: {
          client_user_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          permission?: string
          status?: string
          token?: string
        }
        Update: {
          client_user_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          permission?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          client_user_id: string
          created_at: string
          id: string
          member_user_id: string
          permission: string
        }
        Insert: {
          client_user_id: string
          created_at?: string
          id?: string
          member_user_id: string
          permission?: string
        }
        Update: {
          client_user_id?: string
          created_at?: string
          id?: string
          member_user_id?: string
          permission?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          ad_spend: number
          challenges: string | null
          clicks: number
          created_at: string
          dividend_spend: number
          dm_count: number
          existing_customer_revenue: number
          id: string
          impressions: number
          include_payments: boolean
          leads_count: number
          meetings_held: number
          meetings_planned: number
          net_profit: number
          new_customer_revenue: number
          next_week_plan: string | null
          operational_spend: number
          outsource_spend: number
          reach: number
          report_name: string
          report_type: string
          salary_spend: number
          sales_closed: number
          target_user_id: string | null
          total_expenses: number
          total_revenue: number
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
          weekly_notes: string | null
        }
        Insert: {
          ad_spend?: number
          challenges?: string | null
          clicks?: number
          created_at?: string
          dividend_spend?: number
          dm_count?: number
          existing_customer_revenue?: number
          id?: string
          impressions?: number
          include_payments?: boolean
          leads_count?: number
          meetings_held?: number
          meetings_planned?: number
          net_profit?: number
          new_customer_revenue?: number
          next_week_plan?: string | null
          operational_spend?: number
          outsource_spend?: number
          reach?: number
          report_name?: string
          report_type?: string
          salary_spend?: number
          sales_closed?: number
          target_user_id?: string | null
          total_expenses?: number
          total_revenue?: number
          updated_at?: string
          user_id: string
          week_end: string
          week_start: string
          weekly_notes?: string | null
        }
        Update: {
          ad_spend?: number
          challenges?: string | null
          clicks?: number
          created_at?: string
          dividend_spend?: number
          dm_count?: number
          existing_customer_revenue?: number
          id?: string
          impressions?: number
          include_payments?: boolean
          leads_count?: number
          meetings_held?: number
          meetings_planned?: number
          net_profit?: number
          new_customer_revenue?: number
          next_week_plan?: string | null
          operational_spend?: number
          outsource_spend?: number
          reach?: number
          report_name?: string
          report_type?: string
          salary_spend?: number
          sales_closed?: number
          target_user_id?: string | null
          total_expenses?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
          weekly_notes?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
