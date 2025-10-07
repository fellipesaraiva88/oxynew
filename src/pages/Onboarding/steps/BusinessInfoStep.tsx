import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { OnboardingData } from '../OnboardingWizard';

interface BusinessInfoStepProps {
  data?: OnboardingData['businessInfo'];
  onComplete: (data: OnboardingData['businessInfo']) => void;
  onBack: () => void;
}

const SPECIALTY_OPTIONS = [
  'Banho',
  'Tosa',
  'Consulta Veterinária',
  'Hotel',
  'Daycare',
  'Adestramento',
  'Cirurgia',
  'Vacinação',
  'Exames'
];

export function BusinessInfoStep({ data, onComplete, onBack }: BusinessInfoStepProps) {
  const [formData, setFormData] = useState({
    business_name: data?.business_name || '',
    business_description: data?.business_description || '',
    address: data?.business_info?.address || '',
    phone: data?.business_info?.phone || '',
    whatsapp: data?.business_info?.whatsapp || '',
    specialties: data?.business_info?.specialties || [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [showSpecialtyInput, setShowSpecialtyInput] = useState(false);
  const [customSpecialty, setCustomSpecialty] = useState('');

  const handleAddSpecialty = (specialty: string) => {
    if (!formData.specialties.includes(specialty)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleAddCustomSpecialty = () => {
    if (customSpecialty.trim()) {
      handleAddSpecialty(customSpecialty.trim());
      setCustomSpecialty('');
      setShowSpecialtyInput(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios
    if (!formData.business_name || !formData.business_description) {
      toast.error('Nome e descrição são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const payload = {
        business_name: formData.business_name,
        business_description: formData.business_description,
        business_info: {
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          whatsapp: formData.whatsapp || undefined,
          specialties: formData.specialties.length > 0 ? formData.specialties : undefined
        }
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/onboarding/business-info`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save business info');
      }

      const result = await response.json();
      toast.success('Informações salvas!');
      onComplete(payload);
    } catch (error) {
      console.error('Error saving business info:', error);
      toast.error('Erro ao salvar informações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome do Negócio */}
      <div className="space-y-2">
        <Label htmlFor="business_name">
          Nome do Petshop/Clínica <span className="text-red-500">*</span>
        </Label>
        <Input
          id="business_name"
          placeholder="Ex: PetShop Amigos Peludos"
          value={formData.business_name}
          onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
          required
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="business_description">
          Descrição do Negócio <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="business_description"
          placeholder="Ex: Petshop completo com banho, tosa, consultas veterinárias e hotel para patients. Atendemos cães e gatos de todos os tamanhos."
          value={formData.business_description}
          onChange={(e) => setFormData(prev => ({ ...prev, business_description: e.target.value }))}
          rows={4}
          required
        />
        <p className="text-xs text-gray-500">
          Esta descrição será usada pela IA para apresentar seu negócio aos clientes
        </p>
      </div>

      {/* Endereço */}
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          placeholder="Ex: Rua das Flores, 123 - Centro"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
        />
      </div>

      {/* Telefone e WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            placeholder="(11) 3456-7890"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            placeholder="11987654321"
            value={formData.whatsapp}
            onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
          />
        </div>
      </div>

      {/* Especialidades */}
      <div className="space-y-3">
        <Label>Especialidades do Negócio</Label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map(specialty => (
            <Badge
              key={specialty}
              variant={formData.specialties.includes(specialty) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                if (formData.specialties.includes(specialty)) {
                  handleRemoveSpecialty(specialty);
                } else {
                  handleAddSpecialty(specialty);
                }
              }}
            >
              {specialty}
              {formData.specialties.includes(specialty) && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>

        {/* Selected Specialties */}
        {formData.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.specialties.filter(s => !SPECIALTY_OPTIONS.includes(s)).map(specialty => (
              <Badge key={specialty} variant="secondary">
                {specialty}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveSpecialty(specialty)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Add Custom Specialty */}
        {showSpecialtyInput ? (
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma especialidade"
              value={customSpecialty}
              onChange={(e) => setCustomSpecialty(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSpecialty()}
            />
            <Button type="button" onClick={handleAddCustomSpecialty} size="sm">
              Adicionar
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSpecialtyInput(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar outra especialidade
          </Button>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Próximo'}
        </Button>
      </div>
    </form>
  );
}
