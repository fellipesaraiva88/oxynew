import { useState } from 'react';
import { motion } from 'framer-motion';
import { MagicButton } from '../components/MagicButton';
import { ConversationalCard } from '../components/ConversationalCard';
import { ArrowRight, Clock } from 'lucide-react';
import { OnboardingData } from '../OnboardingV2';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface OperatingHoursProps {
  data: OnboardingData;
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  loading: boolean;
}

const WEEKDAYS = [
  { id: 'monday', label: 'Segunda' },
  { id: 'tuesday', label: 'Terça' },
  { id: 'wednesday', label: 'Quarta' },
  { id: 'thursday', label: 'Quinta' },
  { id: 'friday', label: 'Sexta' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
];

export function OperatingHours({ data, onComplete, onBack, loading }: OperatingHoursProps) {
  const [hours, setHours] = useState(
    data.operating_hours || {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '14:00', closed: false },
      sunday: { open: '', close: '', closed: true },
    }
  );

  const handleToggleDay = (day: string) => {
    setHours({
      ...hours,
      [day]: {
        ...hours[day as keyof typeof hours],
        closed: !hours[day as keyof typeof hours].closed,
      },
    });
  };

  const handleTimeChange = (day: string, field: 'open' | 'close', value: string) => {
    setHours({
      ...hours,
      [day]: {
        ...hours[day as keyof typeof hours],
        [field]: value,
      },
    });
  };

  const handleSubmit = () => {
    onComplete({ operating_hours: hours });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-32">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <ConversationalCard from="oxy_assistant">
            <div className="space-y-3">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Quais são seus horários de funcionamento? ⏰
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Isso ajuda a IA a sugerir horários disponíveis para agendamentos.
              </p>
            </div>
          </ConversationalCard>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl space-y-4">
            {WEEKDAYS.map((day) => {
              const dayHours = hours[day.id as keyof typeof hours];

              return (
                <div key={day.id} className="flex items-center gap-4 py-2">
                  <div className="w-24 flex-shrink-0">
                    <Label className="font-medium">{day.label}</Label>
                  </div>

                  <Switch
                    checked={!dayHours.closed}
                    onCheckedChange={() => handleToggleDay(day.id)}
                  />

                  {!dayHours.closed ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={dayHours.open}
                        onChange={(e) => handleTimeChange(day.id, 'open', e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-gray-500">até</span>
                      <Input
                        type="time"
                        value={dayHours.close}
                        onChange={(e) => handleTimeChange(day.id, 'close', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400 italic flex-1">Fechado</span>
                  )}
                </div>
              );
            })}
          </div>

          <ConversationalCard from="oxy_assistant" delay={0.2}>
            <p className="text-gray-900 dark:text-white">
              Ótimo! A IA vai sugerir horários dentro desse período para seus clientes 📅
            </p>
          </ConversationalCard>

          <div className="flex gap-3 justify-end pt-4">
            <MagicButton variant="outline" onClick={onBack} disabled={loading}>
              Voltar
            </MagicButton>
            <MagicButton
              variant="primary"
              onClick={handleSubmit}
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
