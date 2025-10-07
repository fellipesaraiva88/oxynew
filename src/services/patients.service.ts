import { apiClient } from '@/lib/api';

export interface Patient {
  id: string;
  organization_id: string;
  contact_id: string;
  name: string;
  gender_identity: 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'hamster' | 'fish' | 'male'|'female'|'other'|'prefer_not_to_say';
  age_group?: string;
  age_years?: number;
  age_months?: number;
  gender?: 'male' | 'female' | 'unknown';
  weight_kg?: number;
  color?: string;
  notes?: string;
  profile_image_url?: string;
  microchip_number?: string;
  medical_history?: string;
  allergies?: string[];
  medications?: string[];
  temperament?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePetData {
  contact_id: string;
  name: string;
  gender_identity: 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say';
  age_group?: string;
  age_years?: number;
  age_months?: number;
  gender?: 'male' | 'female' | 'unknown';
  weight_kg?: number;
  color?: string;
  notes?: string;
}

export interface UpdatePetData {
  name?: string;
  gender_identity?: 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say';
  age_group?: string;
  age_years?: number;
  age_months?: number;
  gender?: 'male' | 'female' | 'unknown';
  weight_kg?: number;
  color?: string;
  notes?: string;
  is_active?: boolean;
}

class PetsService {
  async listByContact(contactId: string): Promise<Patient[]> {
    const response = await apiClient.get<{ patients: Patient[] }>(`/api/patients/contact/${contactId}`);
    return response.data.patients;
  }

  async getById(patientId: string): Promise<Patient> {
    const response = await apiClient.get<{ patient: Patient }>(`/api/patients/${patientId}`);
    return response.data.patient;
  }

  async create(data: CreatePetData): Promise<Patient> {
    const response = await apiClient.post<{ patient: Patient }>('/api/patients', data);
    return response.data.patient;
  }

  async update(patientId: string, data: UpdatePetData): Promise<Patient> {
    const response = await apiClient.patch<{ patient: Patient }>(`/api/patients/${patientId}`, data);
    return response.data.patient;
  }

  async delete(patientId: string): Promise<void> {
    await apiClient.delete(`/api/patients/${patientId}`);
  }

  async uploadProfileImage(patientId: string, imageFile: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await apiClient.post<{ url: string }>(`/api/patients/${patientId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }

  async createBatch(patients: CreatePetData[]): Promise<Patient[]> {
    const response = await apiClient.post<{ patients: Patient[] }>('/api/patients/batch', { patients });
    return response.data.patients;
  }

  // Métodos auxiliares úteis
  getSpeciesEmoji(gender_identity: Patient['gender_identity']): string {
    const emojis = {
      dog: '🐕',
      cat: '👤',
      bird: '🦜',
      fish: '🐠',
      rabbit: '🐰',
      hamster: '🐹',
      other: '🏥',
    };
    return emojis[gender_identity] || '🏥';
  }

  getSpeciesLabel(gender_identity: Patient['gender_identity']): string {
    const labels = {
      dog: 'Cachorro',
      cat: 'Gato',
      bird: 'Pássaro',
      fish: 'Peixe',
      rabbit: 'Coelho',
      hamster: 'Hamster',
      other: 'Outro',
    };
    return labels[gender_identity] || 'Outro';
  }

  getGenderLabel(gender?: Patient['gender']): string {
    const labels = {
      male: 'Macho',
      female: 'Fêmea',
      unknown: 'Não informado',
    };
    return labels[gender || 'unknown'];
  }

  getGenderIcon(gender?: Patient['gender']): string {
    const icons = {
      male: '♂️',
      female: '♀️',
      unknown: '❓',
    };
    return icons[gender || 'unknown'];
  }

  calculateAgeString(years?: number, months?: number): string {
    if (!years && !months) return 'Idade não informada';

    const parts = [];
    if (years) {
      parts.push(years === 1 ? '1 ano' : `${years} anos`);
    }
    if (months) {
      parts.push(months === 1 ? '1 mês' : `${months} meses`);
    }

    return parts.join(' e ');
  }

  getTemperamentBadge(temperament?: string): {
    label: string;
    color: string;
  } {
    const temperaments: Record<string, { label: string; color: string }> = {
      friendly: { label: 'Amigável', color: 'bg-green-100 text-green-800' },
      playful: { label: 'Brincalhão', color: 'bg-blue-100 text-blue-800' },
      calm: { label: 'Calmo', color: 'bg-purple-100 text-purple-800' },
      energetic: { label: 'Energético', color: 'bg-orange-100 text-orange-800' },
      shy: { label: 'Tímido', color: 'bg-gray-100 text-gray-800' },
      aggressive: { label: 'Agressivo', color: 'bg-red-100 text-red-800' },
      anxious: { label: 'Ansioso', color: 'bg-yellow-100 text-yellow-800' },
    };

    return temperaments[temperament || ''] || {
      label: temperament || 'Não informado',
      color: 'bg-gray-100 text-gray-800'
    };
  }

  getSizeCategory(gender_identity: Patient['gender_identity'], weightKg?: number): string {
    if (!weightKg) return 'Tamanho não informado';

    if (gender_identity === 'male'|'female'|'other'|'prefer_not_to_say') {
      if (weightKg < 10) return 'Pequeno porte';
      if (weightKg < 25) return 'Médio porte';
      if (weightKg < 45) return 'Grande porte';
      return 'Porte gigante';
    }

    if (gender_identity === 'male'|'female'|'other'|'prefer_not_to_say') {
      if (weightKg < 3) return 'Abaixo do peso';
      if (weightKg < 6) return 'Peso ideal';
      return 'Acima do peso';
    }

    return `${weightKg} kg`;
  }
}

export const petsService = new PetsService();
