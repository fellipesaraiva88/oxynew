import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface BusinessService {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

interface BusinessTypeStepProps {
  onNext: (selectedServices: BusinessService[]) => void;
  initialServices?: BusinessService[];
}

const DEFAULT_SERVICES: BusinessService[] = [
  {
    id: 'petshop',
    name: 'Petshop (venda de produtos)',
    icon: '🏪',
    description: 'Ração, brinquedos, acessórios',
    enabled: false,
  },
  {
    id: 'medical',
    name: 'Clínica Veterinária',
    icon: '🏥',
    description: 'Consultas, exames, cirurgias',
    enabled: false,
  },
  {
    id: 'grooming',
    name: 'Banho e Tosa',
    icon: '🛁',
    description: 'Estética e higiene',
    enabled: false,
  },
  {
    id: 'hotel',
    name: 'Hotel para Patients',
    icon: '🏨',
    description: 'Hospedagem com pernoite',
    enabled: false,
  },
  {
    id: 'daycare',
    name: 'Creche (Day Care)',
    icon: '🏫',
    description: 'Cuidados durante o dia',
    enabled: false,
  },
  {
    id: 'training',
    name: 'Adestramento',
    icon: '🎓',
    description: 'Treinamento comportamental',
    enabled: false,
  },
];

export function BusinessTypeStep({ onNext, initialServices }: BusinessTypeStepProps) {
  const [services, setServices] = useState<BusinessService[]>(
    initialServices || DEFAULT_SERVICES
  );

  const toggleService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? { ...service, enabled: !service.enabled }
          : service
      )
    );
  };

  const handleContinue = () => {
    const selectedServices = services.filter((s) => s.enabled);
    if (selectedServices.length === 0) {
      return; // Exigir pelo menos um serviço
    }
    onNext(selectedServices);
  };

  const selectedCount = services.filter((s) => s.enabled).length;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          🎯 Qual é o seu tipo de negócio?
        </h2>
        <p className="text-lg text-gray-600">
          Selecione todos os serviços que você oferece:
        </p>
      </div>

      {/* Services Grid */}
      <Card className="p-6 space-y-4">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => toggleService(service.id)}
            className={cn(
              'w-full p-4 rounded-lg border-2 transition-all duration-200',
              'hover:shadow-md hover:scale-[1.02]',
              'text-left flex items-start gap-4',
              service.enabled
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            {/* Checkbox */}
            <div
              className={cn(
                'w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1',
                service.enabled
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-300'
              )}
            >
              {service.enabled && <Check className="w-4 h-4 text-white" />}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{service.icon}</span>
                <span className="font-semibold text-gray-900">
                  {service.name}
                </span>
              </div>
              <p className="text-sm text-gray-500 ml-8">
                └─ {service.description}
              </p>
            </div>
          </button>
        ))}
      </Card>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 A IA será configurada especificamente para seus serviços. Ela só
          oferecerá o que você marcou!
        </p>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={selectedCount === 0}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          Continuar →
        </Button>
      </div>

      {/* Selected Count */}
      {selectedCount > 0 && (
        <p className="text-center text-sm text-gray-500">
          {selectedCount} {selectedCount === 1 ? 'serviço selecionado' : 'serviços selecionados'}
        </p>
      )}
    </div>
  );
}
