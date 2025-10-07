export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "13.0.5";
    };
    public: {
        Tables: {
            ai_interactions: {
                Row: {
                    action_taken: string | null;
                    completion_tokens: number | null;
                    confidence_score: number | null;
                    contact_id: string | null;
                    conversation_id: string | null;
                    created_at: string | null;
                    entities_extracted: Json | null;
                    id: string;
                    intent_detected: string | null;
                    message_id: string | null;
                    model: string;
                    organization_id: string;
                    prompt_tokens: number | null;
                    total_cost_cents: number | null;
                };
                Insert: {
                    action_taken?: string | null;
                    completion_tokens?: number | null;
                    confidence_score?: number | null;
                    contact_id?: string | null;
                    conversation_id?: string | null;
                    created_at?: string | null;
                    entities_extracted?: Json | null;
                    id?: string;
                    intent_detected?: string | null;
                    message_id?: string | null;
                    model: string;
                    organization_id: string;
                    prompt_tokens?: number | null;
                    total_cost_cents?: number | null;
                };
                Update: {
                    action_taken?: string | null;
                    completion_tokens?: number | null;
                    confidence_score?: number | null;
                    contact_id?: string | null;
                    conversation_id?: string | null;
                    created_at?: string | null;
                    entities_extracted?: Json | null;
                    id?: string;
                    intent_detected?: string | null;
                    message_id?: string | null;
                    model?: string;
                    organization_id?: string;
                    prompt_tokens?: number | null;
                    total_cost_cents?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "ai_interactions_contact_id_fkey";
                        columns: ["contact_id"];
                        isOneToOne: false;
                        referencedRelation: "contacts";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "ai_interactions_conversation_id_fkey";
                        columns: ["conversation_id"];
                        isOneToOne: false;
                        referencedRelation: "conversations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "ai_interactions_message_id_fkey";
                        columns: ["message_id"];
                        isOneToOne: false;
                        referencedRelation: "messages";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "ai_interactions_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "ai_interactions_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            analytics_events: {
                Row: {
                    created_at: string;
                    event_category: string;
                    event_name: string;
                    id: string;
                    organization_id: string;
                    properties: Json | null;
                    session_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string;
                    event_category: string;
                    event_name: string;
                    id?: string;
                    organization_id: string;
                    properties?: Json | null;
                    session_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string;
                    event_category?: string;
                    event_name?: string;
                    id?: string;
                    organization_id?: string;
                    properties?: Json | null;
                    session_id?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "analytics_events_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "analytics_events_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            audit_logs: {
                Row: {
                    action: string;
                    created_at: string;
                    id: string;
                    ip_address: unknown | null;
                    new_values: Json | null;
                    old_values: Json | null;
                    organization_id: string;
                    record_id: string;
                    table_name: string;
                    user_agent: string | null;
                    user_id: string | null;
                };
                Insert: {
                    action: string;
                    created_at?: string;
                    id?: string;
                    ip_address?: unknown | null;
                    new_values?: Json | null;
                    old_values?: Json | null;
                    organization_id: string;
                    record_id: string;
                    table_name: string;
                    user_agent?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    action?: string;
                    created_at?: string;
                    id?: string;
                    ip_address?: unknown | null;
                    new_values?: Json | null;
                    old_values?: Json | null;
                    organization_id?: string;
                    record_id?: string;
                    table_name?: string;
                    user_agent?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "audit_logs_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            aurora_automations: {
                Row: {
                    action_config: Json;
                    automation_type: string;
                    created_at: string | null;
                    id: string;
                    is_active: boolean | null;
                    last_run_at: string | null;
                    name: string;
                    next_run_at: string | null;
                    organization_id: string;
                    run_count: number | null;
                    success_count: number | null;
                    trigger_config: Json;
                    updated_at: string | null;
                };
                Insert: {
                    action_config: Json;
                    automation_type: string;
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    last_run_at?: string | null;
                    name: string;
                    next_run_at?: string | null;
                    organization_id: string;
                    run_count?: number | null;
                    success_count?: number | null;
                    trigger_config: Json;
                    updated_at?: string | null;
                };
                Update: {
                    action_config?: Json;
                    automation_type?: string;
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    last_run_at?: string | null;
                    name?: string;
                    next_run_at?: string | null;
                    organization_id?: string;
                    run_count?: number | null;
                    success_count?: number | null;
                    trigger_config?: Json;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "aurora_automations_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "aurora_automations_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            aurora_proactive_messages: {
                Row: {
                    content: string;
                    created_at: string | null;
                    id: string;
                    message_type: string;
                    metadata: Json | null;
                    organization_id: string;
                    owner_phone_number: string;
                    scheduled_for: string | null;
                    sent_at: string | null;
                    status: string;
                };
                Insert: {
                    content: string;
                    created_at?: string | null;
                    id?: string;
                    message_type: string;
                    metadata?: Json | null;
                    organization_id: string;
                    owner_phone_number: string;
                    scheduled_for?: string | null;
                    sent_at?: string | null;
                    status: string;
                };
                Update: {
                    content?: string;
                    created_at?: string | null;
                    id?: string;
                    message_type?: string;
                    metadata?: Json | null;
                    organization_id?: string;
                    owner_phone_number?: string;
                    scheduled_for?: string | null;
                    sent_at?: string | null;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "aurora_proactive_messages_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "aurora_proactive_messages_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            authorized_owner_numbers: {
                Row: {
                    created_at: string | null;
                    id: string;
                    is_active: boolean | null;
                    notes: string | null;
                    organization_id: string;
                    owner_name: string;
                    phone_number: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    notes?: string | null;
                    organization_id: string;
                    owner_name: string;
                    phone_number: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    notes?: string | null;
                    organization_id?: string;
                    owner_name?: string;
                    phone_number?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "authorized_owner_numbers_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "authorized_owner_numbers_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            backup_metadata: {
                Row: {
                    backup_type: string;
                    checksum: string;
                    created_at: string;
                    expires_at: string | null;
                    file_size_bytes: number;
                    id: string;
                    organization_id: string;
                    storage_path: string;
                    tables_included: string[];
                };
                Insert: {
                    backup_type: string;
                    checksum: string;
                    created_at?: string;
                    expires_at?: string | null;
                    file_size_bytes: number;
                    id?: string;
                    organization_id: string;
                    storage_path: string;
                    tables_included: string[];
                };
                Update: {
                    backup_type?: string;
                    checksum?: string;
                    created_at?: string;
                    expires_at?: string | null;
                    file_size_bytes?: number;
                    id?: string;
                    organization_id?: string;
                    storage_path?: string;
                    tables_included?: string[];
                };
                Relationships: [
                    {
                        foreignKeyName: "backup_metadata_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "backup_metadata_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            bipe_protocol: {
                Row: {
                    client_question: string | null;
                    conversation_id: string | null;
                    created_at: string;
                    handoff_active: boolean | null;
                    handoff_reason: string | null;
                    id: string;
                    learned: boolean | null;
                    manager_response: string | null;
                    organization_id: string;
                    resolved_at: string | null;
                    status: string;
                    trigger_type: string;
                };
                Insert: {
                    client_question?: string | null;
                    conversation_id?: string | null;
                    created_at?: string;
                    handoff_active?: boolean | null;
                    handoff_reason?: string | null;
                    id?: string;
                    learned?: boolean | null;
                    manager_response?: string | null;
                    organization_id: string;
                    resolved_at?: string | null;
                    status?: string;
                    trigger_type: string;
                };
                Update: {
                    client_question?: string | null;
                    conversation_id?: string | null;
                    created_at?: string;
                    handoff_active?: boolean | null;
                    handoff_reason?: string | null;
                    id?: string;
                    learned?: boolean | null;
                    manager_response?: string | null;
                    organization_id?: string;
                    resolved_at?: string | null;
                    status?: string;
                    trigger_type?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "bipe_protocol_conversation_id_fkey";
                        columns: ["conversation_id"];
                        isOneToOne: false;
                        referencedRelation: "conversations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "bipe_protocol_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "bipe_protocol_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            appointments: {
                Row: {
                    cancellation_reason: string | null;
                    contact_id: string;
                    created_at: string | null;
                    created_by_ai: boolean | null;
                    id: string;
                    notes: string | null;
                    organization_id: string;
                    patient_id: string | null;
                    price_cents: number | null;
                    reminder_sent_at: string | null;
                    scheduled_end: string;
                    scheduled_start: string;
                    service_id: string;
                    status: string;
                    updated_at: string | null;
                    whatsapp_instance_id: string | null;
                };
                Insert: {
                    cancellation_reason?: string | null;
                    contact_id: string;
                    created_at?: string | null;
                    created_by_ai?: boolean | null;
                    id?: string;
                    notes?: string | null;
                    organization_id: string;
                    patient_id?: string | null;
                    price_cents?: number | null;
                    reminder_sent_at?: string | null;
                    scheduled_end: string;
                    scheduled_start: string;
                    service_id: string;
                    status: string;
                    updated_at?: string | null;
                    whatsapp_instance_id?: string | null;
                };
                Update: {
                    cancellation_reason?: string | null;
                    contact_id?: string;
                    created_at?: string | null;
                    created_by_ai?: boolean | null;
                    id?: string;
                    notes?: string | null;
                    organization_id?: string;
                    patient_id?: string | null;
                    price_cents?: number | null;
                    reminder_sent_at?: string | null;
                    scheduled_end?: string;
                    scheduled_start?: string;
                    service_id?: string;
                    status?: string;
                    updated_at?: string | null;
                    whatsapp_instance_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "bookings_contact_id_fkey";
                        columns: ["contact_id"];
                        isOneToOne: false;
                        referencedRelation: "contacts";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "bookings_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "bookings_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "bookings_pet_id_fkey";
                        columns: ["patient_id"];
                        isOneToOne: false;
                        referencedRelation: "patients";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "bookings_service_id_fkey";
                        columns: ["service_id"];
                        isOneToOne: false;
                        referencedRelation: "services";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "bookings_whatsapp_instance_id_fkey";
                        columns: ["whatsapp_instance_id"];
                        isOneToOne: false;
                        referencedRelation: "whatsapp_instances";
                        referencedColumns: ["id"];
                    }
                ];
            };
            clientes_esquecidos: {
                Row: {
                    contact_id: string | null;
                    created_at: string;
                    explicacao_ia: string;
                    horas_de_vacuo: number;
                    id: string;
                    instance_id: string;
                    metadata: Json | null;
                    nome_cliente: string | null;
                    organization_id: string;
                    quando_converteu: string | null;
                    quando_foi: string;
                    quando_respondi: string | null;
                    quem_mandou_ultima: string;
                    resposta_pronta: string;
                    status: string;
                    telefone_cliente: string;
                    temperatura: number;
                    temperatura_emoji: string;
                    temperatura_explicacao: string | null;
                    temperatura_label: string;
                    tipo_vacuo: string;
                    ultima_mensagem: string;
                    updated_at: string;
                    valor_estimado_centavos: number;
                    valor_real_convertido_centavos: number | null;
                };
                Insert: {
                    contact_id?: string | null;
                    created_at?: string;
                    explicacao_ia: string;
                    horas_de_vacuo: number;
                    id?: string;
                    instance_id: string;
                    metadata?: Json | null;
                    nome_cliente?: string | null;
                    organization_id: string;
                    quando_converteu?: string | null;
                    quando_foi: string;
                    quando_respondi?: string | null;
                    quem_mandou_ultima: string;
                    resposta_pronta: string;
                    status?: string;
                    telefone_cliente: string;
                    temperatura: number;
                    temperatura_emoji: string;
                    temperatura_explicacao?: string | null;
                    temperatura_label: string;
                    tipo_vacuo: string;
                    ultima_mensagem: string;
                    updated_at?: string;
                    valor_estimado_centavos?: number;
                    valor_real_convertido_centavos?: number | null;
                };
                Update: {
                    contact_id?: string | null;
                    created_at?: string;
                    explicacao_ia?: string;
                    horas_de_vacuo?: number;
                    id?: string;
                    instance_id?: string;
                    metadata?: Json | null;
                    nome_cliente?: string | null;
                    organization_id?: string;
                    quando_converteu?: string | null;
                    quando_foi?: string;
                    quando_respondi?: string | null;
                    quem_mandou_ultima?: string;
                    resposta_pronta?: string;
                    status?: string;
                    telefone_cliente?: string;
                    temperatura?: number;
                    temperatura_emoji?: string;
                    temperatura_explicacao?: string | null;
                    temperatura_label?: string;
                    tipo_vacuo?: string;
                    ultima_mensagem?: string;
                    updated_at?: string;
                    valor_estimado_centavos?: number;
                    valor_real_convertido_centavos?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "clientes_esquecidos_contact_id_fkey";
                        columns: ["contact_id"];
                        isOneToOne: false;
                        referencedRelation: "contacts";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "clientes_esquecidos_instance_id_fkey";
                        columns: ["instance_id"];
                        isOneToOne: false;
                        referencedRelation: "whatsapp_instances";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "clientes_esquecidos_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "clientes_esquecidos_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            contacts: {
                Row: {
                    address: string | null;
                    created_at: string | null;
                    email: string | null;
                    full_name: string | null;
                    id: string;
                    is_active: boolean | null;
                    last_interaction_at: string | null;
                    notes: string | null;
                    organization_id: string;
                    phone_number: string;
                    tags: string[] | null;
                    updated_at: string | null;
                    whatsapp_instance_id: string | null;
                };
                Insert: {
                    address?: string | null;
                    created_at?: string | null;
                    email?: string | null;
                    full_name?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    last_interaction_at?: string | null;
                    notes?: string | null;
                    organization_id: string;
                    phone_number: string;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    whatsapp_instance_id?: string | null;
                };
                Update: {
                    address?: string | null;
                    created_at?: string | null;
                    email?: string | null;
                    full_name?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    last_interaction_at?: string | null;
                    notes?: string | null;
                    organization_id?: string;
                    phone_number?: string;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    whatsapp_instance_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "contacts_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "contacts_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "contacts_whatsapp_instance_id_fkey";
                        columns: ["whatsapp_instance_id"];
                        isOneToOne: false;
                        referencedRelation: "whatsapp_instances";
                        referencedColumns: ["id"];
                    }
                ];
            };
            conversations: {
                Row: {
                    ai_enabled: boolean | null;
                    contact_id: string | null;
                    created_at: string | null;
                    escalated_to_human_at: string | null;
                    escalation_reason: string | null;
                    handoff_mode: boolean | null;
                    id: string;
                    last_message_at: string | null;
                    organization_id: string;
                    status: string;
                    summary: string | null;
                    tags: string[] | null;
                    updated_at: string | null;
                    whatsapp_instance_id: string;
                };
                Insert: {
                    ai_enabled?: boolean | null;
                    contact_id?: string | null;
                    created_at?: string | null;
                    escalated_to_human_at?: string | null;
                    escalation_reason?: string | null;
                    handoff_mode?: boolean | null;
                    id?: string;
                    last_message_at?: string | null;
                    organization_id: string;
                    status: string;
                    summary?: string | null;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    whatsapp_instance_id: string;
                };
                Update: {
                    ai_enabled?: boolean | null;
                    contact_id?: string | null;
                    created_at?: string | null;
                    escalated_to_human_at?: string | null;
                    escalation_reason?: string | null;
                    handoff_mode?: boolean | null;
                    id?: string;
                    last_message_at?: string | null;
                    organization_id?: string;
                    status?: string;
                    summary?: string | null;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    whatsapp_instance_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "conversations_contact_id_fkey";
                        columns: ["contact_id"];
                        isOneToOne: false;
                        referencedRelation: "contacts";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "conversations_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "conversations_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "conversations_whatsapp_instance_id_fkey";
                        columns: ["whatsapp_instance_id"];
                        isOneToOne: false;
                        referencedRelation: "whatsapp_instances";
                        referencedColumns: ["id"];
                    }
                ];
            };
            daycare_hotel_stays: {
                Row: {
                    behavior_assessment: Json;
                    check_in_date: string;
                    check_out_date: string | null;
                    contact_id: string;
                    created_at: string;
                    daily_routine: Json | null;
                    extra_services: string[] | null;
                    health_assessment: Json;
                    id: string;
                    monitoring_config: Json | null;
                    notes: string | null;
                    organization_id: string;
                    patient_id: string;
                    status: string;
                    stay_type: string;
                    updated_at: string;
                };
                Insert: {
                    behavior_assessment?: Json;
                    check_in_date: string;
                    check_out_date?: string | null;
                    contact_id: string;
                    created_at?: string;
                    daily_routine?: Json | null;
                    extra_services?: string[] | null;
                    health_assessment?: Json;
                    id?: string;
                    monitoring_config?: Json | null;
                    notes?: string | null;
                    organization_id: string;
                    patient_id: string;
                    status?: string;
                    stay_type: string;
                    updated_at?: string;
                };
                Update: {
                    behavior_assessment?: Json;
                    check_in_date?: string;
                    check_out_date?: string | null;
                    contact_id?: string;
                    created_at?: string;
                    daily_routine?: Json | null;
                    extra_services?: string[] | null;
                    health_assessment?: Json;
                    id?: string;
                    monitoring_config?: Json | null;
                    notes?: string | null;
                    organization_id?: string;
                    patient_id?: string;
                    status?: string;
                    stay_type?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "daycare_hotel_stays_contact_id_fkey";
                        columns: ["contact_id"];
                        isOneToOne: false;
                        referencedRelation: "contacts";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "daycare_hotel_stays_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "daycare_hotel_stays_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "daycare_hotel_stays_pet_id_fkey";
                        columns: ["patient_id"];
                        isOneToOne: false;
                        referencedRelation: "patients";
                        referencedColumns: ["id"];
                    }
                ];
            };
            internal_audit_log: {
                Row: {
                    action: string;
                    changes: Json | null;
                    created_at: string;
                    id: string;
                    ip_address: unknown | null;
                    resource_id: string | null;
                    resource_type: string;
                    user_agent: string | null;
                    user_email: string;
                    user_id: string;
                    user_role: Database["public"]["Enums"]["internal_role"];
                };
                Insert: {
                    action: string;
                    changes?: Json | null;
                    created_at?: string;
                    id?: string;
                    ip_address?: unknown | null;
                    resource_id?: string | null;
                    resource_type: string;
                    user_agent?: string | null;
                    user_email: string;
                    user_id: string;
                    user_role: Database["public"]["Enums"]["internal_role"];
                };
                Update: {
                    action?: string;
                    changes?: Json | null;
                    created_at?: string;
                    id?: string;
                    ip_address?: unknown | null;
                    resource_id?: string | null;
                    resource_type?: string;
                    user_agent?: string | null;
                    user_email?: string;
                    user_id?: string;
                    user_role?: Database["public"]["Enums"]["internal_role"];
                };
                Relationships: [
                    {
                        foreignKeyName: "internal_audit_log_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "internal_users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            internal_users: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    email: string;
                    id: string;
                    is_active: boolean;
                    last_login_at: string | null;
                    name: string;
                    password_hash: string;
                    role: Database["public"]["Enums"]["internal_role"];
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    email: string;
                    id?: string;
                    is_active?: boolean;
                    last_login_at?: string | null;
                    name: string;
                    password_hash: string;
                    role?: Database["public"]["Enums"]["internal_role"];
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    email?: string;
                    id?: string;
                    is_active?: boolean;
                    last_login_at?: string | null;
                    name?: string;
                    password_hash?: string;
                    role?: Database["public"]["Enums"]["internal_role"];
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "internal_users_created_by_fkey";
                        columns: ["created_by"];
                        isOneToOne: false;
                        referencedRelation: "internal_users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            knowledge_base: {
                Row: {
                    answer: string;
                    created_at: string;
                    id: string;
                    last_used_at: string | null;
                    learned_from_bipe_id: string | null;
                    organization_id: string;
                    question: string;
                    source: string | null;
                    updated_at: string;
                    usage_count: number | null;
                };
                Insert: {
                    answer: string;
                    created_at?: string;
                    id?: string;
                    last_used_at?: string | null;
                    learned_from_bipe_id?: string | null;
                    organization_id: string;
                    question: string;
                    source?: string | null;
                    updated_at?: string;
                    usage_count?: number | null;
                };
                Update: {
                    answer?: string;
                    created_at?: string;
                    id?: string;
                    last_used_at?: string | null;
                    learned_from_bipe_id?: string | null;
                    organization_id?: string;
                    question?: string;
                    source?: string | null;
                    updated_at?: string;
                    usage_count?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "knowledge_base_learned_from_bipe_id_fkey";
                        columns: ["learned_from_bipe_id"];
                        isOneToOne: false;
                        referencedRelation: "bipe_protocol";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "knowledge_base_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "knowledge_base_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            message_queue: {
                Row: {
                    attempts: number;
                    completed_at: string | null;
                    created_at: string;
                    error_message: string | null;
                    id: string;
                    job_type: string;
                    max_attempts: number;
                    message_id: string | null;
                    organization_id: string;
                    payload: Json;
                    priority: number;
                    scheduled_for: string;
                    started_at: string | null;
                    status: string;
                };
                Insert: {
                    attempts?: number;
                    completed_at?: string | null;
                    created_at?: string;
                    error_message?: string | null;
                    id?: string;
                    job_type: string;
                    max_attempts?: number;
                    message_id?: string | null;
                    organization_id: string;
                    payload: Json;
                    priority?: number;
                    scheduled_for?: string;
                    started_at?: string | null;
                    status?: string;
                };
                Update: {
                    attempts?: number;
                    completed_at?: string | null;
                    created_at?: string;
                    error_message?: string | null;
                    id?: string;
                    job_type?: string;
                    max_attempts?: number;
                    message_id?: string | null;
                    organization_id?: string;
                    payload?: Json;
                    priority?: number;
                    scheduled_for?: string;
                    started_at?: string | null;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "message_queue_message_id_fkey";
                        columns: ["message_id"];
                        isOneToOne: false;
                        referencedRelation: "messages";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "message_queue_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "message_queue_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            messages: {
                Row: {
                    content: string | null;
                    conversation_id: string;
                    created_at: string | null;
                    direction: string;
                    id: string;
                    media_type: string | null;
                    media_url: string | null;
                    metadata: Json | null;
                    organization_id: string;
                    sent_by_ai: boolean | null;
                    status: string | null;
                    whatsapp_message_id: string | null;
                };
                Insert: {
                    content?: string | null;
                    conversation_id: string;
                    created_at?: string | null;
                    direction: string;
                    id?: string;
                    media_type?: string | null;
                    media_url?: string | null;
                    metadata?: Json | null;
                    organization_id: string;
                    sent_by_ai?: boolean | null;
                    status?: string | null;
                    whatsapp_message_id?: string | null;
                };
                Update: {
                    content?: string | null;
                    conversation_id?: string;
                    created_at?: string | null;
                    direction?: string;
                    id?: string;
                    media_type?: string | null;
                    media_url?: string | null;
                    metadata?: Json | null;
                    organization_id?: string;
                    sent_by_ai?: boolean | null;
                    status?: string | null;
                    whatsapp_message_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "messages_conversation_id_fkey";
                        columns: ["conversation_id"];
                        isOneToOne: false;
                        referencedRelation: "conversations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "messages_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "messages_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            organization_settings: {
                Row: {
                    ai_client_enabled: boolean | null;
                    ai_client_model: string | null;
                    ai_client_temperature: number | null;
                    aurora_daily_summary_time: string | null;
                    aurora_enabled: boolean | null;
                    aurora_model: string | null;
                    bipe_limit_triggers: Json | null;
                    bipe_phone_number: string | null;
                    business_hours: Json | null;
                    created_at: string | null;
                    emergency_contact: Json | null;
                    feature_flags: Json | null;
                    id: string;
                    organization_id: string;
                    payment_methods: Json | null;
                    services_config: Json | null;
                    updated_at: string | null;
                };
                Insert: {
                    ai_client_enabled?: boolean | null;
                    ai_client_model?: string | null;
                    ai_client_temperature?: number | null;
                    aurora_daily_summary_time?: string | null;
                    aurora_enabled?: boolean | null;
                    aurora_model?: string | null;
                    bipe_limit_triggers?: Json | null;
                    bipe_phone_number?: string | null;
                    business_hours?: Json | null;
                    created_at?: string | null;
                    emergency_contact?: Json | null;
                    feature_flags?: Json | null;
                    id?: string;
                    organization_id: string;
                    payment_methods?: Json | null;
                    services_config?: Json | null;
                    updated_at?: string | null;
                };
                Update: {
                    ai_client_enabled?: boolean | null;
                    ai_client_model?: string | null;
                    ai_client_temperature?: number | null;
                    aurora_daily_summary_time?: string | null;
                    aurora_enabled?: boolean | null;
                    aurora_model?: string | null;
                    bipe_limit_triggers?: Json | null;
                    bipe_phone_number?: string | null;
                    business_hours?: Json | null;
                    created_at?: string | null;
                    emergency_contact?: Json | null;
                    feature_flags?: Json | null;
                    id?: string;
                    organization_id?: string;
                    payment_methods?: Json | null;
                    services_config?: Json | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "organization_settings_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: true;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "organization_settings_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: true;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            organizations: {
                Row: {
                    address: string | null;
                    created_at: string | null;
                    email: string;
                    id: string;
                    is_active: boolean;
                    name: string;
                    phone: string | null;
                    quota_instances: number;
                    quota_messages_monthly: number;
                    settings: Json | null;
                    subscription_plan: string;
                    subscription_status: string;
                    updated_at: string | null;
                };
                Insert: {
                    address?: string | null;
                    created_at?: string | null;
                    email: string;
                    id?: string;
                    is_active?: boolean;
                    name: string;
                    phone?: string | null;
                    quota_instances?: number;
                    quota_messages_monthly?: number;
                    settings?: Json | null;
                    subscription_plan?: string;
                    subscription_status?: string;
                    updated_at?: string | null;
                };
                Update: {
                    address?: string | null;
                    created_at?: string | null;
                    email?: string;
                    id?: string;
                    is_active?: boolean;
                    name?: string;
                    phone?: string | null;
                    quota_instances?: number;
                    quota_messages_monthly?: number;
                    settings?: Json | null;
                    subscription_plan?: string;
                    subscription_status?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            patients: {
                Row: {
                    age_months: number | null;
                    age_years: number | null;
                    allergies: string[] | null;
                    age_group: string | null;
                    color: string | null;
                    contact_id: string;
                    created_at: string | null;
                    gender: string | null;
                    id: string;
                    is_active: boolean | null;
                    has_chronic_condition: boolean | null;
                    medical_history: string | null;
                    name: string;
                    organization_id: string;
                    gender_identity: string;
                    updated_at: string | null;
                    vaccinations: Json | null;
                    weight_kg: number | null;
                };
                Insert: {
                    age_months?: number | null;
                    age_years?: number | null;
                    allergies?: string[] | null;
                    age_group?: string | null;
                    color?: string | null;
                    contact_id: string;
                    created_at?: string | null;
                    gender?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    has_chronic_condition?: boolean | null;
                    medical_history?: string | null;
                    name: string;
                    organization_id: string;
                    gender_identity: string;
                    updated_at?: string | null;
                    vaccinations?: Json | null;
                    weight_kg?: number | null;
                };
                Update: {
                    age_months?: number | null;
                    age_years?: number | null;
                    allergies?: string[] | null;
                    age_group?: string | null;
                    color?: string | null;
                    contact_id?: string;
                    created_at?: string | null;
                    gender?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    has_chronic_condition?: boolean | null;
                    medical_history?: string | null;
                    name?: string;
                    organization_id?: string;
                    gender_identity?: string;
                    updated_at?: string | null;
                    vaccinations?: Json | null;
                    weight_kg?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "pets_contact_id_fkey";
                        columns: ["contact_id"];
                        isOneToOne: false;
                        referencedRelation: "contacts";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "pets_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "pets_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            scheduled_followups: {
                Row: {
                    booking_id: string | null;
                    contact_id: string;
                    created_at: string | null;
                    error_message: string | null;
                    id: string;
                    message_template: string;
                    organization_id: string;
                    scheduled_for: string;
                    sent_at: string | null;
                    status: string;
                    updated_at: string | null;
                };
                Insert: {
                    booking_id?: string | null;
                    contact_id: string;
                    created_at?: string | null;
                    error_message?: string | null;
                    id?: string;
                    message_template: string;
                    organization_id: string;
                    scheduled_for: string;
                    sent_at?: string | null;
                    status: string;
                    updated_at?: string | null;
                };
                Update: {
                    booking_id?: string | null;
                    contact_id?: string;
                    created_at?: string | null;
                    error_message?: string | null;
                    id?: string;
                    message_template?: string;
                    organization_id?: string;
                    scheduled_for?: string;
                    sent_at?: string | null;
                    status?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "scheduled_followups_booking_id_fkey";
                        columns: ["booking_id"];
                        isOneToOne: false;
                        referencedRelation: "appointments";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "scheduled_followups_contact_id_fkey";
                        columns: ["contact_id"];
                        isOneToOne: false;
                        referencedRelation: "contacts";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "scheduled_followups_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "scheduled_followups_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            services: {
                Row: {
                    created_at: string | null;
                    deposit_percentage: number | null;
                    description: string | null;
                    duration_minutes: number;
                    id: string;
                    is_active: boolean | null;
                    name: string;
                    organization_id: string;
                    price_cents: number;
                    requires_deposit: boolean | null;
                    type: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    deposit_percentage?: number | null;
                    description?: string | null;
                    duration_minutes?: number;
                    id?: string;
                    is_active?: boolean | null;
                    name: string;
                    organization_id: string;
                    price_cents?: number;
                    requires_deposit?: boolean | null;
                    type: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    deposit_percentage?: number | null;
                    description?: string | null;
                    duration_minutes?: number;
                    id?: string;
                    is_active?: boolean | null;
                    name?: string;
                    organization_id?: string;
                    price_cents?: number;
                    requires_deposit?: boolean | null;
                    type?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "services_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "services_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            training_plans: {
                Row: {
                    contact_id: string;
                    created_at: string;
                    duration_weeks: number;
                    id: string;
                    initial_assessment: Json;
                    location_type: string | null;
                    long_term_goals: string[] | null;
                    methodology: string | null;
                    organization_id: string;
                    patient_id: string;
                    plan_type: string;
                    session_duration_minutes: number | null;
                    session_frequency: number;
                    short_term_goals: string[] | null;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    contact_id: string;
                    created_at?: string;
                    duration_weeks: number;
                    id?: string;
                    initial_assessment?: Json;
                    location_type?: string | null;
                    long_term_goals?: string[] | null;
                    methodology?: string | null;
                    organization_id: string;
                    patient_id: string;
                    plan_type: string;
                    session_duration_minutes?: number | null;
                    session_frequency: number;
                    short_term_goals?: string[] | null;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    contact_id?: string;
                    created_at?: string;
                    duration_weeks?: number;
                    id?: string;
                    initial_assessment?: Json;
                    location_type?: string | null;
                    long_term_goals?: string[] | null;
                    methodology?: string | null;
                    organization_id?: string;
                    patient_id?: string;
                    plan_type?: string;
                    session_duration_minutes?: number | null;
                    session_frequency?: number;
                    short_term_goals?: string[] | null;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "training_plans_contact_id_fkey";
                        columns: ["contact_id"];
                        isOneToOne: false;
                        referencedRelation: "contacts";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "training_plans_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "training_plans_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "training_plans_pet_id_fkey";
                        columns: ["patient_id"];
                        isOneToOne: false;
                        referencedRelation: "patients";
                        referencedColumns: ["id"];
                    }
                ];
            };
            users: {
                Row: {
                    auth_user_id: string | null;
                    created_at: string | null;
                    email: string;
                    full_name: string;
                    id: string;
                    organization_id: string;
                    role: string;
                    updated_at: string | null;
                };
                Insert: {
                    auth_user_id?: string | null;
                    created_at?: string | null;
                    email: string;
                    full_name: string;
                    id?: string;
                    organization_id: string;
                    role: string;
                    updated_at?: string | null;
                };
                Update: {
                    auth_user_id?: string | null;
                    created_at?: string | null;
                    email?: string;
                    full_name?: string;
                    id?: string;
                    organization_id?: string;
                    role?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "users_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "users_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            webhook_deliveries: {
                Row: {
                    attempts: number;
                    created_at: string;
                    delivered_at: string | null;
                    error_message: string | null;
                    event_type: string;
                    id: string;
                    max_attempts: number;
                    next_retry_at: string | null;
                    organization_id: string;
                    payload: Json;
                    response_body: string | null;
                    response_status: number | null;
                    status: string;
                    webhook_url: string;
                };
                Insert: {
                    attempts?: number;
                    created_at?: string;
                    delivered_at?: string | null;
                    error_message?: string | null;
                    event_type: string;
                    id?: string;
                    max_attempts?: number;
                    next_retry_at?: string | null;
                    organization_id: string;
                    payload: Json;
                    response_body?: string | null;
                    response_status?: number | null;
                    status?: string;
                    webhook_url: string;
                };
                Update: {
                    attempts?: number;
                    created_at?: string;
                    delivered_at?: string | null;
                    error_message?: string | null;
                    event_type?: string;
                    id?: string;
                    max_attempts?: number;
                    next_retry_at?: string | null;
                    organization_id?: string;
                    payload?: Json;
                    response_body?: string | null;
                    response_status?: number | null;
                    status?: string;
                    webhook_url?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "webhook_deliveries_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "webhook_deliveries_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
            whatsapp_instances: {
                Row: {
                    created_at: string | null;
                    id: string;
                    instance_name: string;
                    last_connected_at: string | null;
                    organization_id: string;
                    phone_number: string | null;
                    qr_code: string | null;
                    session_data: Json | null;
                    status: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    instance_name: string;
                    last_connected_at?: string | null;
                    organization_id: string;
                    phone_number?: string | null;
                    qr_code?: string | null;
                    session_data?: Json | null;
                    status: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    instance_name?: string;
                    last_connected_at?: string | null;
                    organization_id?: string;
                    phone_number?: string | null;
                    qr_code?: string | null;
                    session_data?: Json | null;
                    status?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "whatsapp_instances_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "dashboard_metrics";
                        referencedColumns: ["organization_id"];
                    },
                    {
                        foreignKeyName: "whatsapp_instances_organization_id_fkey";
                        columns: ["organization_id"];
                        isOneToOne: false;
                        referencedRelation: "organizations";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            dashboard_metrics: {
                Row: {
                    active_contacts: number | null;
                    active_conversations: number | null;
                    active_pets: number | null;
                    ai_interactions_7d: number | null;
                    avg_ai_confidence_7d: number | null;
                    bookings_this_month: number | null;
                    bookings_this_week: number | null;
                    bookings_today: number | null;
                    conversations_waiting_human: number | null;
                    last_refreshed_at: string | null;
                    messages_today: number | null;
                    new_contacts_today: number | null;
                    organization_id: string | null;
                    organization_name: string | null;
                    revenue_this_month_cents: number | null;
                    revenue_this_week_cents: number | null;
                };
                Relationships: [];
            };
        };
        Functions: {
            cleanup_expired_backups: {
                Args: Record<PropertyKey, never>;
                Returns: number;
            };
            get_clientes_esquecidos_stats: {
                Args: {
                    p_organization_id: string;
                };
                Returns: {
                    taxa_conversao: number;
                    total_achei: number;
                    total_clientes: number;
                    total_deixei_quieto: number;
                    total_frios: number;
                    total_ja_respondi: number;
                    total_mornos: number;
                    total_quentes: number;
                    total_virou_cliente: number;
                    valor_real_convertido_reais: number;
                    valor_total_estimado_reais: number;
                }[];
            };
            get_organization_stats: {
                Args: {
                    org_id: string;
                };
                Returns: Json;
            };
            get_user_organization_id: {
                Args: Record<PropertyKey, never>;
                Returns: string;
            };
            increment_knowledge_usage: {
                Args: {
                    knowledge_id: string;
                };
                Returns: undefined;
            };
            log_internal_action: {
                Args: {
                    p_action: string;
                    p_changes?: Json;
                    p_ip_address?: unknown;
                    p_resource_id?: string;
                    p_resource_type: string;
                    p_user_agent?: string;
                    p_user_id: string;
                };
                Returns: string;
            };
            process_pending_queue_jobs: {
                Args: Record<PropertyKey, never>;
                Returns: {
                    job_id: string;
                    job_type: string;
                    organization_id: string;
                    payload: Json;
                }[];
            };
            refresh_analytics_views: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
            retry_failed_queue_jobs: {
                Args: Record<PropertyKey, never>;
                Returns: number;
            };
        };
        Enums: {
            internal_role: "super_admin" | "tech" | "cs" | "sales" | "marketing" | "viewer";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
    Row: infer R;
} ? R : never : never;
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
} ? I : never : never;
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
} ? U : never : never;
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
    schema: keyof DatabaseWithoutInternals;
}, EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
    schema: keyof DatabaseWithoutInternals;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export declare const Constants: {
    readonly public: {
        readonly Enums: {
            readonly internal_role: readonly ["super_admin", "tech", "cs", "sales", "marketing", "viewer"];
        };
    };
};
export {};
//# sourceMappingURL=types.d.ts.map