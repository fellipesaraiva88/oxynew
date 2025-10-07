import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Sparkles, MessageSquare, Clock, Package } from 'lucide-react';
import type { OnboardingData } from '../OnboardingWizard';

interface CompletionStepProps {
  data: OnboardingData;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}

export function CompletionStep({ data, onComplete, onBack, loading }: CompletionStepProps) {
  const formatDaySchedule = (day: string, schedule: any) => {
    if (schedule.closed) return 'Fechado';
    return `${schedule.open} - ${schedule.close}`;
  };

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Configuração Concluída!
        </h3>
        <p className="text-gray-600">
          Revise suas informações e ative sua IA de atendimento
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Business Info */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 mb-1">Informações do Negócio</h4>
              <p className="text-sm text-gray-600 break-words">
                <strong>{data.businessInfo?.business_name}</strong>
              </p>
              <p className="text-sm text-gray-500 mt-1 break-words">
                {data.businessInfo?.business_description}
              </p>
              {data.businessInfo?.business_info?.address && (
                <p className="text-xs text-gray-400 mt-2">
                  📍 {data.businessInfo.business_info.address}
                </p>
              )}
              {data.businessInfo?.business_info?.specialties &&
                data.businessInfo.business_info.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.businessInfo.business_info.specialties.map(spec => (
                      <span key={spec} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </Card>

        {/* Operating Hours */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">Horários de Funcionamento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {data.operatingHours && Object.entries(data.operatingHours).map(([day, schedule]) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-gray-600 capitalize">
                      {day === 'monday' && 'Segunda'}
                      {day === 'tuesday' && 'Terça'}
                      {day === 'wednesday' && 'Quarta'}
                      {day === 'thursday' && 'Quinta'}
                      {day === 'friday' && 'Sexta'}
                      {day === 'saturday' && 'Sábado'}
                      {day === 'sunday' && 'Domingo'}:
                    </span>
                    <span className={schedule.closed ? 'text-gray-400' : 'text-gray-900'}>
                      {formatDaySchedule(day, schedule)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Services */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">
                Serviços Configurados ({data.services?.length || 0})
              </h4>
              <div className="space-y-2">
                {data.services?.map((service, index) => (
                  <div key={index} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium text-gray-900">{formatPrice(service.price_cents)}</p>
                      <p className="text-xs text-gray-500">{service.duration_minutes}min</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* What Happens Next */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-1" />
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              O que acontece agora?
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Sua IA Cliente será ativada com as informações configuradas</li>
              <li>✅ Ela conhecerá seu negócio, horários e serviços</li>
              <li>✅ Poderá atender clientes 24/7 via WhatsApp</li>
              <li>✅ Cadastrar patients, agendar serviços e responder dúvidas</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Voltar
        </Button>
        <Button onClick={onComplete} disabled={loading} size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          {loading ? (
            <>
              <span className="mr-2">Ativando IA...</span>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Ativar IA Cliente
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
