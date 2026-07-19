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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          payment_id: string | null
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          payment_id?: string | null
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          payment_id?: string | null
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_payment_fk"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: Database["public"]["Enums"]["entitlement_kind"] | null
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["coupon_kind"]
          max_redemptions: number | null
          starts_at: string | null
          times_redeemed: number
          updated_at: string
          value: number
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["entitlement_kind"] | null
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["coupon_kind"]
          max_redemptions?: number | null
          starts_at?: string | null
          times_redeemed?: number
          updated_at?: string
          value: number
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["entitlement_kind"] | null
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["coupon_kind"]
          max_redemptions?: number | null
          starts_at?: string | null
          times_redeemed?: number
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      export_orders: {
        Row: {
          created_at: string
          entitlement_used:
            | Database["public"]["Enums"]["entitlement_kind"]
            | null
          file_size_bytes: number | null
          id: string
          kind: Database["public"]["Enums"]["export_kind"]
          member_count: number | null
          tree_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entitlement_used?:
            | Database["public"]["Enums"]["entitlement_kind"]
            | null
          file_size_bytes?: number | null
          id?: string
          kind: Database["public"]["Enums"]["export_kind"]
          member_count?: number | null
          tree_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entitlement_used?:
            | Database["public"]["Enums"]["entitlement_kind"]
            | null
          file_size_bytes?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["export_kind"]
          member_count?: number | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_orders_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          birth_place: string | null
          created_at: string
          current_place: string | null
          date_of_birth: string | null
          date_of_death: string | null
          display_name: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          generation: number | null
          hide_contact: boolean
          hide_dob: boolean
          id: string
          is_alive: boolean
          is_root: boolean
          notes: string | null
          occupation: string | null
          photo_url: string | null
          tree_id: string
          updated_at: string
        }
        Insert: {
          birth_place?: string | null
          created_at?: string
          current_place?: string | null
          date_of_birth?: string | null
          date_of_death?: string | null
          display_name?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          generation?: number | null
          hide_contact?: boolean
          hide_dob?: boolean
          id?: string
          is_alive?: boolean
          is_root?: boolean
          notes?: string | null
          occupation?: string | null
          photo_url?: string | null
          tree_id: string
          updated_at?: string
        }
        Update: {
          birth_place?: string | null
          created_at?: string
          current_place?: string | null
          date_of_birth?: string | null
          date_of_death?: string | null
          display_name?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          generation?: number | null
          hide_contact?: boolean
          hide_dob?: boolean
          id?: string
          is_alive?: boolean
          is_root?: boolean
          notes?: string | null
          occupation?: string | null
          photo_url?: string | null
          tree_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      family_trees: {
        Row: {
          ancestral_village: string | null
          created_at: string
          description: string | null
          gotra: string | null
          id: string
          kul: string | null
          language: string
          name: string
          owner_id: string
          share_token: string | null
          surname: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["tree_visibility"]
        }
        Insert: {
          ancestral_village?: string | null
          created_at?: string
          description?: string | null
          gotra?: string | null
          id?: string
          kul?: string | null
          language?: string
          name: string
          owner_id: string
          share_token?: string | null
          surname?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["tree_visibility"]
        }
        Update: {
          ancestral_village?: string | null
          created_at?: string
          description?: string | null
          gotra?: string | null
          id?: string
          kul?: string | null
          language?: string
          name?: string
          owner_id?: string
          share_token?: string | null
          surname?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["tree_visibility"]
        }
        Relationships: []
      }
      marriages: {
        Row: {
          created_at: string
          id: string
          marriage_date: string | null
          marriage_place: string | null
          notes: string | null
          spouse_a_id: string
          spouse_b_id: string
          status: Database["public"]["Enums"]["marriage_status"]
          tree_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          marriage_date?: string | null
          marriage_place?: string | null
          notes?: string | null
          spouse_a_id: string
          spouse_b_id: string
          status?: Database["public"]["Enums"]["marriage_status"]
          tree_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          marriage_date?: string | null
          marriage_place?: string | null
          notes?: string | null
          spouse_a_id?: string
          spouse_b_id?: string
          status?: Database["public"]["Enums"]["marriage_status"]
          tree_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marriages_spouse_a_id_fkey"
            columns: ["spouse_a_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marriages_spouse_b_id_fkey"
            columns: ["spouse_b_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marriages_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_child_relationships: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
          relationship_type: Database["public"]["Enums"]["parent_child_type"]
          tree_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
          relationship_type?: Database["public"]["Enums"]["parent_child_type"]
          tree_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
          relationship_type?: Database["public"]["Enums"]["parent_child_type"]
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_relationships_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_relationships_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_relationships_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_entitlements: {
        Row: {
          entitlement: Database["public"]["Enums"]["entitlement_kind"]
          granted_at: string
          id: string
          payment_id: string | null
          tree_id: string
          user_id: string
        }
        Insert: {
          entitlement: Database["public"]["Enums"]["entitlement_kind"]
          granted_at?: string
          id?: string
          payment_id?: string | null
          tree_id: string
          user_id: string
        }
        Update: {
          entitlement?: Database["public"]["Enums"]["entitlement_kind"]
          granted_at?: string
          id?: string
          payment_id?: string | null
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_entitlements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_entitlements_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paise: number
          coupon_id: string | null
          created_at: string
          currency: string
          discount_paise: number
          entitlement: Database["public"]["Enums"]["entitlement_kind"]
          error_reason: string | null
          id: string
          metadata: Json
          paid_at: string | null
          plan_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tree_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          coupon_id?: string | null
          created_at?: string
          currency?: string
          discount_paise?: number
          entitlement: Database["public"]["Enums"]["entitlement_kind"]
          error_reason?: string | null
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tree_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          coupon_id?: string | null
          created_at?: string
          currency?: string
          discount_paise?: number
          entitlement?: Database["public"]["Enums"]["entitlement_kind"]
          error_reason?: string | null
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tree_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          amount_paise: number
          code: string
          created_at: string
          currency: string
          description: string | null
          entitlement: Database["public"]["Enums"]["entitlement_kind"]
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount_paise: number
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          entitlement: Database["public"]["Enums"]["entitlement_kind"]
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          entitlement?: Database["public"]["Enums"]["entitlement_kind"]
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_banners: {
        Row: {
          bg_color: string
          created_at: string
          id: string
          is_active: boolean
          link_label: string | null
          link_url: string | null
          message: string
          placement: string
          sort_order: number
          text_color: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          message: string
          placement?: string
          sort_order?: number
          text_color?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          message?: string
          placement?: string
          sort_order?: number
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      tree_collaborators: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["collab_role"]
          tree_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["collab_role"]
          tree_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["collab_role"]
          tree_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_collaborators_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["collab_role"]
          token: string
          tree_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["collab_role"]
          token?: string
          tree_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["collab_role"]
          token?: string
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_invitations_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { _token: string }
        Returns: {
          role: Database["public"]["Enums"]["collab_role"]
          tree_id: string
        }[]
      }
      can_edit_tree: {
        Args: { _tree_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_tree: {
        Args: { _tree_id: string; _user_id: string }
        Returns: boolean
      }
      get_shared_tree: {
        Args: { _token?: string; _tree_id: string }
        Returns: {
          ancestral_village: string
          description: string
          gotra: string
          id: string
          kul: string
          name: string
          surname: string
          visibility: Database["public"]["Enums"]["tree_visibility"]
        }[]
      }
      get_shared_tree_members: {
        Args: { _token?: string; _tree_id: string }
        Returns: {
          birth_place: string
          current_place: string
          date_of_birth: string
          full_name: string
          gender: string
          generation: number
          hide_contact: boolean
          hide_dob: boolean
          id: string
          is_alive: boolean
          is_root: boolean
          occupation: string
        }[]
      }
      has_entitlement: {
        Args: {
          _kind: Database["public"]["Enums"]["entitlement_kind"]
          _tree_id: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_tree_owner: {
        Args: { _tree_id: string; _user_id: string }
        Returns: boolean
      }
      peek_invitation: {
        Args: { _token: string }
        Returns: {
          expires_at: string
          role: Database["public"]["Enums"]["collab_role"]
          tree_id: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "family_owner"
        | "family_admin"
        | "contributor"
        | "viewer"
      collab_role: "viewer" | "editor"
      coupon_kind: "percent" | "flat"
      entitlement_kind: "full_pdf" | "poster_pdf" | "high_res_bundle"
      export_kind: "preview_pdf" | "full_pdf" | "poster_pdf"
      gender_type: "male" | "female" | "other"
      marriage_status: "married" | "divorced" | "widowed" | "separated"
      parent_child_type: "biological" | "adopted" | "step"
      payment_status: "created" | "attempted" | "paid" | "failed" | "refunded"
      tree_visibility: "private" | "link" | "public"
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
      app_role: [
        "super_admin",
        "family_owner",
        "family_admin",
        "contributor",
        "viewer",
      ],
      collab_role: ["viewer", "editor"],
      coupon_kind: ["percent", "flat"],
      entitlement_kind: ["full_pdf", "poster_pdf", "high_res_bundle"],
      export_kind: ["preview_pdf", "full_pdf", "poster_pdf"],
      gender_type: ["male", "female", "other"],
      marriage_status: ["married", "divorced", "widowed", "separated"],
      parent_child_type: ["biological", "adopted", "step"],
      payment_status: ["created", "attempted", "paid", "failed", "refunded"],
      tree_visibility: ["private", "link", "public"],
    },
  },
} as const
