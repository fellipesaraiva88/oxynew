import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings2, MessageCircle, Zap, Clock, Mic } from 'lucide-react';

interface AIConfig {
  attendanceEnabled: boolean;
  autoBooking: boolean;
  autoRegistration: boolean;
  autoSales: boolean;
  workingHours: { start: string; end: string };
  tone: 'professional' | 'friendly' | 'casual';
}

interface AIConfigTabsProps {
  config?: AIConfig;
  onSave?: (config: AIConfig) => void;
}

const toneOptions: { value: 'professional' | 'friendly' | 'casual'; label: string; desc: string }[] = [
  { value: 'professional', label: 'Profissional', desc: 'Formal e direto ao ponto' },
  { value: 'friendly', label: 'Amigável', desc: 'Acolhedor e próximo' },
  { value: 'casual', label: 'Descontraído', desc: 'Informal e leve' },
];

export function AIConfigTabs({ config, onSave }: AIConfigTabsProps) {
  const [localConfig, setLocalConfig] = useState<AIConfig>(config || {
    attendanceEnabled: true,
    autoBooking: true,
    autoRegistration: true,
    autoSales: true,
    workingHours: { start: '08:00', end: '18:00' },
    tone: 'friendly',
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-ocean-blue" />
          Como Ela Trabalha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="atendimento" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="atendimento">
              <MessageCircle className="w-4 h-4 mr-2" />
              Atendimento
            </TabsTrigger>
            <TabsTrigger value="automacoes">
              <Zap className="w-4 h-4 mr-2" />
              Automações
            </TabsTrigger>
            <TabsTrigger value="horarios">
              <Clock className="w-4 h-4 mr-2" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="tom">
              <Mic className="w-4 h-4 mr-2" />
              Tom de Voz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="atendimento" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label htmlFor="attendance" className="font-medium">
                    Responder Clientes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Atender dúvidas e perguntas automaticamente
                  </p>
                </div>
                <Switch
                  id="attendance"
                  checked={localConfig.attendanceEnabled}
                  onCheckedChange={(checked) =>
                    setLocalConfig({ ...localConfig, attendanceEnabled: checked })
                  }
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">O que ela responde:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✅ Dúvidas sobre serviços e preços</li>
                  <li>✅ Informações sobre vacinas e cuidados</li>
                  <li>✅ Horários de funcionamento</li>
                  <li>✅ Disponibilidade de agendamento</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="automacoes" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label htmlFor="autoBooking" className="font-medium">
                    Marcar Agendamentos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Criar agendas automaticamente
                  </p>
                </div>
                <Switch
                  id="autoBooking"
                  checked={localConfig.autoBooking}
                  onCheckedChange={(checked) =>
                    setLocalConfig({ ...localConfig, autoBooking: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label htmlFor="autoRegistration" className="font-medium">
                    Cadastrar Clientes e Patients
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Criar cadastros durante conversa
                  </p>
                </div>
                <Switch
                  id="autoRegistration"
                  checked={localConfig.autoRegistration}
                  onCheckedChange={(checked) =>
                    setLocalConfig({ ...localConfig, autoRegistration: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label htmlFor="autoSales" className="font-medium">
                    Registrar Vendas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Salvar pedidos e vendas
                  </p>
                </div>
                <Switch
                  id="autoSales"
                  checked={localConfig.autoSales}
                  onCheckedChange={(checked) =>
                    setLocalConfig({ ...localConfig, autoSales: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="horarios" className="space-y-4 mt-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">Horário de Trabalho</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start" className="text-green-800">Início</Label>
                  <input
                    id="start"
                    type="time"
                    value={localConfig.workingHours.start}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        workingHours: { ...localConfig.workingHours, start: e.target.value },
                      })
                    }
                    className="w-full mt-1 p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="end" className="text-green-800">Fim</Label>
                  <input
                    id="end"
                    type="time"
                    value={localConfig.workingHours.end}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        workingHours: { ...localConfig.workingHours, end: e.target.value },
                      })
                    }
                    className="w-full mt-1 p-2 border rounded-lg"
                  />
                </div>
              </div>
              <p className="text-sm text-green-700 mt-3">
                Fora desse horário, ela informa que retorna depois
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tom" className="space-y-4 mt-4">
            <div className="space-y-3">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLocalConfig({ ...localConfig, tone: option.value })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    localConfig.tone === option.value
                      ? 'border-ocean-blue bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.desc}</div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={() => onSave?.(localConfig)}
          className="w-full mt-6 btn-gradient text-white"
        >
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
