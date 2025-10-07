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
      clientes_esquecidos: {
        Row: {
          contact_id: string | null
          created_at: string
          explicacao_ia: string
          horas_de_vacuo: number
          id: string
          instance_id: string
          metadata: Json | null
          nome_cliente: string | null
          organization_id: string
          quando_converteu: string | null
          quando_foi: string
          quando_respondi: string | null
          quem_mandou_ultima: string
          resposta_pronta: string
          status: string
          telefone_cliente: string
          temperatura: number
          temperatura_emoji: string
          temperatura_explicacao: string | null
          temperatura_label: string
          tipo_vacuo: string
          ultima_mensagem: string
          updated_at: string
          valor_estimado_centavos: number
          valor_real_convertido_centavos: number | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          explicacao_ia: string
          horas_de_vacuo: number
          id?: string
          instance_id: string
          metadata?: Json | null
          nome_cliente?: string | null
          organization_id: string
          quando_converteu?: string | null
          quando_foi: string
          quando_respondi?: string | null
          quem_mandou_ultima: string
          resposta_pronta: string
          status?: string
          telefone_cliente: string
          temperatura: number
          temperatura_emoji: string
          temperatura_explicacao?: string | null
          temperatura_label: string
          tipo_vacuo: string
          ultima_mensagem: string
          updated_at?: string
          valor_estimado_centavos?: number
          valor_real_convertido_centavos?: number | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          explicacao_ia?: string
          horas_de_vacuo?: number
          id?: string
          instance_id?: string
          metadata?: Json | null
          nome_cliente?: string | null
          organization_id?: string
          quando_converteu?: string | null
          quando_foi?: string
          quando_respondi?: string | null
          quem_mandou_ultima?: string
          resposta_pronta?: string
          status?: string
          telefone_cliente?: string
          temperatura?: number
          temperatura_emoji?: string
          temperatura_explicacao?: string | null
          temperatura_label?: string
          tipo_vacuo?: string
          ultima_mensagem?: string
          updated_at?: string
          valor_estimado_centavos?: number
          valor_real_convertido_centavos?: number | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          quota_instances: number
          quota_messages_monthly: number
          settings: Json | null
          subscription_plan: string
          subscription_status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          quota_instances?: number
          quota_messages_monthly?: number
          settings?: Json | null
          subscription_plan?: string
          subscription_status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          quota_instances?: number
          quota_messages_monthly?: number
          settings?: Json | null
          subscription_plan?: string
          subscription_status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      // ... other tables omitted for brevity
    }
    Functions: {
      get_clientes_esquecidos_stats: {
        Args: { p_organization_id: string }
        Returns: {
          taxa_conversao: number
          total_achei: number
          total_clientes: number
          total_deixei_quieto: number
          total_frios: number
          total_ja_respondi: number
          total_mornos: number
          total_quentes: number
          total_virou_cliente: number
          valor_real_convertido_reais: number
          valor_total_estimado_reais: number
        }[]
      }
    }
    Enums: {
      internal_role:
        | "super_admin"
        | "tech"
        | "cs"
        | "sales"
        | "marketing"
        | "viewer"
    }
  }
}
