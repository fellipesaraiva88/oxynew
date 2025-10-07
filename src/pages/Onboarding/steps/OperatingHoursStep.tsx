import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { OnboardingData, DaySchedule } from '../OnboardingWizard';

interface OperatingHoursStepProps {
  data?: OnboardingData['operatingHours'];
  onComplete: (data: OnboardingData['operatingHours']) => void;
  onBack: () => void;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
] as const;

const DEFAULT_HOURS: DaySchedule = {
  open: '08:00',
  close: '18:00',
  closed: false
};

export function OperatingHoursStep({ data, onComplete, onBack }: OperatingHoursStepProps) {
  const [hours, setHours] = useState<OnboardingData['operatingHours']>(
    data || {
      monday: DEFAULT_HOURS,
      tuesday: DEFAULT_HOURS,
      wednesday: DEFAULT_HOURS,
      thursday: DEFAULT_HOURS,
      friday: DEFAULT_HOURS,
      saturday: { ...DEFAULT_HOURS, closed: false },
      sunday: { closed: true }
    }
  );
  const [loading, setLoading] = useState(false);

  const handleToggleDay = (day: keyof typeof hours) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev![day],
        closed: !prev![day].closed
      }
    }));
  };

  const handleTimeChange = (
    day: keyof typeof hours,
    field: 'open' | 'close',
    value: string
  ) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev![day],
        [field]: value
      }
    }));
  };

  const handleApplyToAll = () => {
    const mondaySchedule = hours!.monday;
    if (mondaySchedule.closed) {
      toast.error('Não é possível aplicar um dia fechado para todos');
      return;
    }

    setHours({
      monday: mondaySchedule,
      tuesday: { ...mondaySchedule },
      wednesday: { ...mondaySchedule },
      thursday: { ...mondaySchedule },
      friday: { ...mondaySchedule },
      saturday: { ...mondaySchedule },
      sunday: { ...mondaySchedule }
    });

    toast.success('Horários aplicados para todos os dias');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que pelo menos um dia está aberto
    const allClosed = Object.values(hours!).every(day => day.closed);
    if (allClosed) {
      toast.error('Pelo menos um dia deve estar aberto');
      return;
    }

    // Validar horários dos dias abertos
    for (const [dayKey, schedule] of Object.entries(hours!)) {
      if (!schedule.closed) {
        if (!schedule.open || !schedule.close) {
          const dayName = DAYS_OF_WEEK.find(d => d.key === dayKey)?.label;
          toast.error(`Informe horários de abertura e fechamento para ${dayName}`);
          return;
        }

        // Validar formato HH:MM
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(schedule.open) || !timeRegex.test(schedule.close)) {
          const dayName = DAYS_OF_WEEK.find(d => d.key === dayKey)?.label;
          toast.error(`Formato de horário inválido para ${dayName}. Use HH:MM`);
          return;
        }

        // Validar que abertura é antes do fechamento
        if (schedule.open >= schedule.close) {
          const dayName = DAYS_OF_WEEK.find(d => d.key === dayKey)?.label;
          toast.error(`Horário de abertura deve ser antes do fechamento em ${dayName}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/onboarding/operating-hours`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(hours)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save operating hours');
      }

      toast.success('Horários salvos!');
      onComplete(hours!);
    } catch (error) {
      console.error('Error saving operating hours:', error);
      toast.error('Erro ao salvar horários');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Configure os horários de funcionamento da sua loja
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyToAll}
          >
            Aplicar seg-dom
          </Button>
        </div>

        {DAYS_OF_WEEK.map(({ key, label }) => (
          <div
            key={key}
            className="p-4 border rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">{label}</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor={`${key}-closed`} className="text-sm">
                  {hours![key].closed ? 'Fechado' : 'Aberto'}
                </Label>
                <Switch
                  id={`${key}-closed`}
                  checked={!hours![key].closed}
                  onCheckedChange={() => handleToggleDay(key)}
                />
              </div>
            </div>

            {!hours![key].closed && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${key}-open`} className="text-sm">
                    Abertura
                  </Label>
                  <Input
                    id={`${key}-open`}
                    type="time"
                    value={hours![key].open || ''}
                    onChange={(e) => handleTimeChange(key, 'open', e.target.value)}
                    required={!hours![key].closed}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${key}-close`} className="text-sm">
                    Fechamento
                  </Label>
                  <Input
                    id={`${key}-close`}
                    type="time"
                    value={hours![key].close || ''}
                    onChange={(e) => handleTimeChange(key, 'close', e.target.value)}
                    required={!hours![key].closed}
                  />
                </div>
              </div>
            )}
          </div>
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
