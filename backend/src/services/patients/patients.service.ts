import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { Tables, TablesInsert } from '../../types/database.types.js';

export type Patient = Tables<'patients'>;

export interface PetLegacy {
  id: string;
  organization_id: string;
  contact_id: string;
  name: string;
  gender_identity: 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say';
  age_group: string | null;
  age_years: number | null;
  age_months: number | null;
  weight_kg: number | null;
  color: string | null;
  gender: 'male' | 'female' | 'unknown' | null;
  has_chronic_condition: boolean | null;
  medical_history: string | null;
  allergies: string[];
  vaccinations: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePetData {
  organization_id: string;
  contact_id: string;
  name: string;
  gender_identity: 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say';
  age_group?: string;
  age_years?: number;
  age_months?: number;
  weight_kg?: number;
  color?: string;
  gender?: 'male' | 'female' | 'unknown';
  has_chronic_condition?: boolean;
  medical_history?: string;
  allergies?: string[];
  vaccinations?: any;
}

export interface UpdatePetData {
  name?: string;
  age_group?: string;
  age_years?: number;
  age_months?: number;
  weight_kg?: number;
  color?: string;
  gender?: 'male' | 'female' | 'unknown';
  has_chronic_condition?: boolean;
  medical_history?: string;
  allergies?: string[];
  vaccinations?: any;
  is_active?: boolean;
}

export class PatientsService {
  /**
   * Cria um novo patient
   */
  async create(data: CreatePetData): Promise<Patient> {
    try {
      const petData: TablesInsert<'patients'> = {
        ...data,
        allergies: data.allergies || [],
        vaccinations: data.vaccinations || [],
        is_active: true
      };
      const { data: patient, error } = await supabaseAdmin
        .from('patients')
        .insert(petData)
        .select()
        .single() as { data: Patient | null; error: any };

      if (error || !patient) {
        throw error || new Error('Failed to create patient');
      }

      logger.info({ patientId: patient.id, name: data.name }, 'Patient created');
      return patient;
    } catch (error) {
      logger.error({ error, data }, 'Error creating patient');
      throw error;
    }
  }

  /**
   * Busca patient por ID
   */
  async findById(patientId: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) {
      logger.error({ error, patientId }, 'Error finding patient by ID');
      return null;
    }

    return data as Patient;
  }

  /**
   * Lista patients de um contato
   */
  async listByContact(contactId: string): Promise<Patient[]> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('contact_id', contactId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error, contactId }, 'Error listing patients by contact');
      return [];
    }

    return data as Patient[];
  }

  /**
   * Lista todos os patients de uma organização
   */
  async listByOrganization(
    organizationId: string,
    filters?: {
      gender_identity?: string;
      isActive?: boolean;
      searchQuery?: string;
    }
  ): Promise<Patient[]> {
    let query = supabaseAdmin
      .from('patients')
      .select('*, contacts(full_name, phone_number)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.gender_identity) {
      query = query.eq('gender_identity', filters.gender_identity);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,age_group.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error, organizationId }, 'Error listing patients by organization');
      return [];
    }

    return data as Patient[];
  }

  /**
   * Atualiza patient
   */
  async update(patientId: string, data: UpdatePetData): Promise<Patient | null> {
    const { data: updated, error } = await supabaseAdmin
      .from('patients')
      .update(data)
      .eq('id', patientId)
      .select()
      .single() as { data: Patient | null; error: any };

    if (error) {
      logger.error({ error, patientId }, 'Error updating patient');
      return null;
    }

    logger.info({ patientId }, 'Patient updated');
    return updated as Patient;
  }

  /**
   * Adiciona vacinação
   */
  async addVaccination(
    patientId: string,
    vaccination: {
      name: string;
      date: string;
      nextDate?: string;
      veterinarian?: string;
      notes?: string;
    }
  ): Promise<void> {
    const patient = await this.findById(patientId);
    if (!patient) return;

    const vaccinations = Array.isArray(patient.vaccinations) ? patient.vaccinations : [];
    vaccinations.push({
      ...vaccination,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    });

    await this.update(patientId, { vaccinations });
  }

  /**
   * Adiciona alergia
   */
  async addAllergy(patientId: string, allergy: string): Promise<void> {
    const patient = await this.findById(patientId);
    if (!patient) return;

    const allergies = patient.allergies || [];
    if (!allergies.includes(allergy)) {
      allergies.push(allergy);
      await this.update(patientId, { allergies });
    }
  }

  /**
   * Remove alergia
   */
  async removeAllergy(patientId: string, allergy: string): Promise<void> {
    const patient = await this.findById(patientId);
    if (!patient) return;

    const allergies = (patient.allergies || []).filter(a => a !== allergy);
    await this.update(patientId, { allergies });
  }

  /**
   * Busca patients por nome
   */
  async searchByName(organizationId: string, name: string): Promise<Patient[]> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('organization_id', organizationId)
      .ilike('name', `%${name}%`)
      .eq('is_active', true)
      .limit(10);

    if (error) {
      logger.error({ error, name }, 'Error searching patients by name');
      return [];
    }

    return data as Patient[];
  }

  /**
   * Desativa patient
   */
  async deactivate(patientId: string): Promise<void> {
    await this.update(patientId, { is_active: false });
  }

  /**
   * Reativa patient
   */
  async reactivate(patientId: string): Promise<void> {
    await this.update(patientId, { is_active: true });
  }

  /**
   * Deleta patient permanentemente
   */
  async delete(patientId: string): Promise<void> {
    await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', patientId);

    logger.info({ patientId }, 'Patient deleted');
  }
}

export const patientsService = new PatientsService();
