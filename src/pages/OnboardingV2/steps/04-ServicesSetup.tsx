import { useState } from 'react';
import { motion } from 'framer-motion';
import { MagicButton } from '../components/MagicButton';
import { ConversationalCard } from '../components/ConversationalCard';
import { ArrowRight, Scissors, Stethoscope, Hotel, GraduationCap, Syringe, TestTube } from 'lucide-react';
import { OnboardingData } from '../OnboardingV2';
import { Card } from '@/components/ui/card';

interface ServicesSetupProps {
  data: OnboardingData;
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  loading: boolean;
}

const SERVICES = [
  { id: 'banho', name: 'Banho & Tosa', icon: Scissors, color: 'from-blue-500 to-cyan-500' },
  { id: 'consulta', name: 'Consulta Veterinária', icon: Stethoscope, color: 'from-green-500 to-emerald-500' },
  { id: 'hotel', name: 'Hotel & Daycare', icon: Hotel, color: 'from-purple-500 to-pink-500' },
  { id: 'adestramento', name: 'Adestramento', icon: GraduationCap, color: 'from-orange-500 to-red-500' },
  { id: 'vacinacao', name: 'Vacinação', icon: Syringe, color: 'from-teal-500 to-cyan-500' },
  { id: 'exames', name: 'Exames', icon: TestTube, color: 'from-indigo-500 to-purple-500' },
];

export function ServicesSetup({ data, onComplete, onBack, loading }: ServicesSetupProps) {
  const [selected, setSelected] = useState<string[]>(data.services || []);

  const toggleService = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    onComplete({ services: selected });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-32">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <ConversationalCard from="oxy_assistant">
            <div className="space-y-3">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Quais serviços você oferece? 🛠️
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Selecione todos que se aplicam:
              </p>
            </div>
          </ConversationalCard>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SERVICES.map((service) => (
              <motion.div
                key={service.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all p-6 ${
                    selected.includes(service.id)
                      ? 'border-2 border-purple-500 shadow-lg'
                      : 'border border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => toggleService(service.id)}
                >
                  <div className="text-center space-y-3">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                      <service.icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-medium text-sm">{service.name}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {selected.length > 0 && (
            <ConversationalCard from="oxy_assistant" delay={0.2}>
              <p className="text-gray-900 dark:text-white">
                Perfeito! Seus clientes poderão agendar: <strong>{selected.join(', ')}</strong> 📋
              </p>
            </ConversationalCard>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <MagicButton variant="outline" onClick={onBack} disabled={loading}>
              Voltar
            </MagicButton>
            <MagicButton
              variant="primary"
              onClick={handleSubmit}
              disabled={selected.length === 0}
              loading={loading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Próximo
            </MagicButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
