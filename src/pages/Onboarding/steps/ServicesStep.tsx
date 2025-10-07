import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { OnboardingData, ServiceData } from '../OnboardingWizard';

interface ServicesStepProps {
  data?: OnboardingData['services'];
  onComplete: (data: OnboardingData['services']) => void;
  onBack: () => void;
}

const SERVICE_CATEGORIES = [
  { value: 'grooming', label: 'Banho e Tosa' },
  { value: 'consultation', label: 'Consulta Veterinária' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'daycare', label: 'Daycare' },
  { value: 'training', label: 'Adestramento' },
  { value: 'surgery', label: 'Cirurgia' },
  { value: 'exam', label: 'Exames' },
  { value: 'vaccine', label: 'Vacinação' },
  { value: 'male'|'female'|'other'|'prefer_not_to_say', label: 'Outro' }
];

const EMPTY_SERVICE: ServiceData = {
  name: '',
  category: 'grooming',
  description: '',
  duration_minutes: 60,
  price_cents: 0
};

export function ServicesStep({ data, onComplete, onBack }: ServicesStepProps) {
  const [services, setServices] = useState<ServiceData[]>(
    data && data.length > 0 ? data : [{ ...EMPTY_SERVICE }]
  );
  const [loading, setLoading] = useState(false);

  const handleAddService = () => {
    setServices(prev => [...prev, { ...EMPTY_SERVICE }]);
  };

  const handleRemoveService = (index: number) => {
    if (services.length === 1) {
      toast.error('Mantenha pelo menos um serviço');
      return;
    }
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: keyof ServiceData, value: any) => {
    setServices(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePriceChange = (index: number, value: string) => {
    // Converter R$ para centavos
    const numericValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const cents = Math.round(numericValue * 100);
    handleServiceChange(index, 'price_cents', cents);
  };

  const formatPriceToBRL = (cents: number): string => {
    return (cents / 100).toFixed(2).replace('.', ',');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos os serviços
    for (let i = 0; i < services.length; i++) {
      const service = services[i];

      if (!service.name.trim()) {
        toast.error(`Serviço ${i + 1}: Nome é obrigatório`);
        return;
      }

      if (!service.category) {
        toast.error(`Serviço ${i + 1}: Categoria é obrigatória`);
        return;
      }

      if (service.duration_minutes <= 0) {
        toast.error(`Serviço ${i + 1}: Duração deve ser maior que 0`);
        return;
      }

      if (service.price_cents <= 0) {
        toast.error(`Serviço ${i + 1}: Preço deve ser maior que 0`);
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/onboarding/services`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ services })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save services');
      }

      toast.success('Serviços salvos!');
      onComplete(services);
    } catch (error) {
      console.error('Error saving services:', error);
      toast.error('Erro ao salvar serviços');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Adicione os serviços que você oferece
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddService}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Serviço
          </Button>
        </div>

        {services.map((service, index) => (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Serviço {index + 1}</h3>
              {services.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveService(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor={`service-name-${index}`}>
                  Nome do Serviço <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`service-name-${index}`}
                  placeholder="Ex: Banho e Tosa Completa"
                  value={service.name}
                  onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                  required
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor={`service-category-${index}`}>
                  Categoria <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={service.category}
                  onValueChange={(value) => handleServiceChange(index, 'category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duração */}
              <div className="space-y-2">
                <Label htmlFor={`service-duration-${index}`}>
                  Duração (minutos) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={`service-duration-${index}`}
                    type="number"
                    min="1"
                    placeholder="60"
                    value={service.duration_minutes}
                    onChange={(e) => handleServiceChange(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Preço */}
              <div className="space-y-2">
                <Label htmlFor={`service-price-${index}`}>
                  Preço (R$) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={`service-price-${index}`}
                    type="text"
                    placeholder="0,00"
                    value={formatPriceToBRL(service.price_cents)}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Descrição (opcional) */}
            <div className="space-y-2">
              <Label htmlFor={`service-description-${index}`}>
                Descrição (opcional)
              </Label>
              <Textarea
                id={`service-description-${index}`}
                placeholder="Detalhes sobre o serviço..."
                value={service.description}
                onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                rows={2}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Próximo'}
        </Button>
      </div>
    </form>
  );
}
