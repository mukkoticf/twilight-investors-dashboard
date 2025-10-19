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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
<<<<<<< HEAD
      investors: {
        Row: {
          investor_id: string
          investor_name: string
          email: string
          phone: string
          pan_number: string
          created_at: string
          updated_at: string
        }
        Insert: {
          investor_id?: string
          investor_name: string
          email: string
          phone: string
          pan_number: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          investor_id?: string
          investor_name?: string
          email?: string
          phone?: string
          pan_number?: string
          created_at?: string
          updated_at?: string
        }
      }
      company_pools: {
        Row: {
          purchase_id: string
          pool_name: string
          description: string
          owner_names: string[]
          vehicle_numbers: string[]
          purchase_date: string
          total_cost: number
          bank_loan_amount: number
          investor_amount: number
          monthly_emi: number
          emergency_fund_collected: number
          emergency_fund_company_share: number
          emergency_fund_investor_share: number
          emergency_fund_remaining: number
          status: 'Active' | 'Inactive' | 'Sold'
          created_at: string
          updated_at: string
        }
        Insert: {
          purchase_id?: string
          pool_name: string
          description: string
          owner_names: string[]
          vehicle_numbers: string[]
          purchase_date: string
          total_cost: number
          bank_loan_amount: number
          investor_amount: number
          monthly_emi: number
          emergency_fund_collected: number
          emergency_fund_company_share: number
          emergency_fund_investor_share: number
          emergency_fund_remaining: number
          status?: 'Active' | 'Inactive' | 'Sold'
          created_at?: string
          updated_at?: string
        }
        Update: {
          purchase_id?: string
          pool_name?: string
          description?: string
          owner_names?: string[]
          vehicle_numbers?: string[]
          purchase_date?: string
          total_cost?: number
          bank_loan_amount?: number
          investor_amount?: number
          monthly_emi?: number
          emergency_fund_collected?: number
          emergency_fund_company_share?: number
          emergency_fund_investor_share?: number
          emergency_fund_remaining?: number
          status?: 'Active' | 'Inactive' | 'Sold'
          created_at?: string
          updated_at?: string
        }
      }
      investor_investments: {
        Row: {
          investment_id: string
          investor_id: string
          purchase_id: string
          investment_amount: number
          investment_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          investment_id?: string
          investor_id: string
          purchase_id: string
          investment_amount: number
          investment_percentage: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          investment_id?: string
          investor_id?: string
          purchase_id?: string
          investment_amount?: number
          investment_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      quarterly_roi_declarations: {
        Row: {
          declaration_id: string
          quarter_year: string
          roi_percentage: number
          declaration_date: string
          purchase_id: string
          is_finalized: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          declaration_id?: string
          quarter_year: string
          roi_percentage: number
          declaration_date: string
          purchase_id: string
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          declaration_id?: string
          quarter_year?: string
          roi_percentage?: number
          declaration_date?: string
          purchase_id?: string
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      investor_quarterly_payments: {
        Row: {
          payment_id: string
          investor_id: string
          declaration_id: string
          gross_roi_amount: number
          emergency_fund_deduction: number
          tds_deduction: number
          net_payable_amount: number
          payment_status: 'Pending' | 'Paid' | 'Failed'
          payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          payment_id?: string
          investor_id: string
          declaration_id: string
          gross_roi_amount: number
          emergency_fund_deduction: number
          tds_deduction: number
          net_payable_amount: number
          payment_status?: 'Pending' | 'Paid' | 'Failed'
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          payment_id?: string
          investor_id?: string
          declaration_id?: string
          gross_roi_amount?: number
          emergency_fund_deduction?: number
          tds_deduction?: number
          net_payable_amount?: number
          payment_status?: 'Pending' | 'Paid' | 'Failed'
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_quarterly_payments: {
        Args: {
          declaration_id: string
        }
        Returns: number
      }
      calculate_quarterly_roi: {
        Args: {
          investor_id: string
          declaration_id: string
        }
        Returns: {
          gross_roi: number
          emergency_fund_deduction: number
          tds_deduction: number
          net_payable: number
        }[]
      }
      calculate_investment_percentage: {
        Args: {
          investment_amount: number
          total_investor_amount: number
        }
        Returns: number
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
  public: {
    Enums: {},
  },
} as const
