import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Dog,
  Settings,
  Plus,
  Trash2,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { contactsService } from "@/services/contacts.service";
import { petsService } from '@/services/patients.service';
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/PhoneInput";

interface CreateClientPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PetData {
  id: string;
  name: string;
  gender_identity: "dog" | "cat" | "other";
  age_group: string;
  age_years: number;
  weight_kg: number;
  notes: string;
}

export function CreateClientPetModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateClientPetModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Estado do Cliente
  const [clientData, setClientData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: "",
  });

  // Estado dos Patients
  const [patients, setPets] = useState<PetData[]>([]);

  // Estado das Preferências
  const [preferences, setPreferences] = useState({
    preferred_time: "morning",
    preferred_days: [] as string[],
    favorite_services: [] as string[],
    communication_preference: "whatsapp",
    allow_reminders: true,
    allow_promotions: false,
  });

  // Validação de cada etapa
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!clientData.full_name || !clientData.phone_number) {
          toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Nome e telefone são obrigatórios",
          });
          return false;
        }
        return true;
      case 2:
        return true; // Patients são opcionais
      case 3:
        return true; // Preferências são opcionais
      default:
        return true;
    }
  };

  // Navegar entre steps
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  // Adicionar novo patient
  const addPet = () => {
    setPets([
      ...patients,
      {
        id: `temp-${Date.now()}`,
        name: "",
        gender_identity: "dog",
        age_group: "",
        age_years: 0,
        weight_kg: 0,
        notes: "",
      },
    ]);
  };

  // Remover patient
  const removePet = (id: string) => {
    setPets(patients.filter((p) => p.id !== id));
  };

  // Atualizar patient
  const updatePet = (id: string, field: keyof PetData, value: any) => {
    setPets(patients.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  // Buscar CEP (mock por enquanto)
  const handleCEPSearch = async () => {
    if (clientData.zip_code.length === 8) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${clientData.zip_code}/json/`
        );
        const data = await response.json();
        if (!data.erro) {
          setClientData({
            ...clientData,
            address: data.logradouro,
            city: data.localidade,
            state: data.uf,
          });
          toast({
            title: "✅ CEP encontrado!",
            description: "Endereço preenchido automaticamente",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  // Criar cliente e patients
  const handleCreate = async () => {
    if (!validateStep(1)) return;

    setIsCreating(true);
    try {
      // Criar cliente
      const client = await contactsService.create({
        phone_number: clientData.phone_number.replace(/\D/g, ''),
        full_name: clientData.full_name,
        email: clientData.email || undefined,
        notes: clientData.notes || undefined,
        tags: preferences.favorite_services,
      });

      // Criar patients
      for (const patient of patients.filter((p) => p.name)) {
        await petsService.create({
          contact_id: client.id,
          name: patient.name,
          gender_identity: patient.gender_identity,
          age_group: patient.age_group || undefined,
          age_years: patient.age_years || undefined,
          weight_kg: patient.weight_kg || undefined,
          notes: patient.notes || undefined,
        });
      }

      toast({
        title: "🎉 Cliente cadastrado com sucesso!",
        description: `${clientData.full_name} foi adicionado com ${patients.length} patient(s)`,
      });

      // Resetar formulário
      setClientData({
        full_name: "",
        phone_number: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        notes: "",
      });
      setPets([]);
      setCurrentStep(1);

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar cliente",
        description: error.response?.data?.error || "Tente novamente",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const steps = [
    { number: 1, title: "Dados do Cliente", icon: User },
    { number: 2, title: "Adicionar Patients", icon: Dog },
    { number: 3, title: "Preferências", icon: Settings },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro Completo de Cliente</DialogTitle>
          <DialogDescription>
            Preencha todas as informações para um cadastro completo
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(step.number)}
                  className="flex items-center"
                  disabled={isCreating}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      currentStep === step.number
                        ? "bg-primary text-primary-foreground"
                        : currentStep > step.number
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "ml-2 text-sm font-medium",
                      currentStep === step.number
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={cn(
                        "h-1 rounded",
                        currentStep > step.number ? "bg-green-500" : "bg-muted"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    placeholder="João da Silva"
                    value={clientData.full_name}
                    onChange={(e) =>
                      setClientData({ ...clientData, full_name: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (com DDD) *</Label>
                  <PhoneInput
                    value={clientData.phone_number}
                    onChange={(value) =>
                      setClientData({ ...clientData, phone_number: value })
                    }
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="joao@email.com"
                      value={clientData.email}
                      onChange={(e) =>
                        setClientData({ ...clientData, email: e.target.value })
                      }
                      disabled={isCreating}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" disabled>
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      placeholder="12345678"
                      value={clientData.zip_code}
                      onChange={(e) =>
                        setClientData({ ...clientData, zip_code: e.target.value })
                      }
                      disabled={isCreating}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCEPSearch}
                      disabled={isCreating}
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    placeholder="Rua, número, complemento"
                    value={clientData.address}
                    onChange={(e) =>
                      setClientData({ ...clientData, address: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="São Paulo"
                    value={clientData.city}
                    onChange={(e) =>
                      setClientData({ ...clientData, city: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    value={clientData.state}
                    onChange={(e) =>
                      setClientData({ ...clientData, state: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais sobre o cliente..."
                    value={clientData.notes}
                    onChange={(e) =>
                      setClientData({ ...clientData, notes: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Adicione os patients do cliente (opcional)
                </p>
                <Button onClick={addPet} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Patient
                </Button>
              </div>

              {patients.length === 0 ? (
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Dog className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum patient adicionado</p>
                  <Button onClick={addPet} variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Patient
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {patients.map((patient, idx) => (
                    <Card key={patient.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">Patient {idx + 1}</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removePet(patient.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Nome do Patient *</Label>
                          <Input
                            placeholder="Rex"
                            value={patient.name}
                            onChange={(e) =>
                              updatePet(patient.id, "name", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Espécie</Label>
                          <Select
                            value={patient.gender_identity}
                            onValueChange={(v) =>
                              updatePet(patient.id, "gender_identity", v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dog">Cachorro</SelectItem>
                              <SelectItem value="cat">Gato</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Raça</Label>
                          <Input
                            placeholder="Golden Retriever"
                            value={patient.age_group}
                            onChange={(e) =>
                              updatePet(patient.id, "age_group", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Idade (anos)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="3"
                            value={patient.age_years}
                            onChange={(e) =>
                              updatePet(
                                patient.id,
                                "age_years",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Peso (kg)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="25.5"
                            value={patient.weight_kg}
                            onChange={(e) =>
                              updatePet(
                                patient.id,
                                "weight_kg",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Observações</Label>
                          <Input
                            placeholder="Alérgico a..."
                            value={patient.notes}
                            onChange={(e) =>
                              updatePet(patient.id, "notes", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-4">
                <div>
                  <Label>Horário Preferido</Label>
                  <Select
                    value={preferences.preferred_time}
                    onValueChange={(v) =>
                      setPreferences({ ...preferences, preferred_time: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Manhã (8h-12h)</SelectItem>
                      <SelectItem value="afternoon">Tarde (12h-18h)</SelectItem>
                      <SelectItem value="evening">Noite (18h-21h)</SelectItem>
                      <SelectItem value="any">Qualquer horário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Dias Preferidos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
                      <Badge
                        key={day}
                        variant={
                          preferences.preferred_days.includes(day)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          if (preferences.preferred_days.includes(day)) {
                            setPreferences({
                              ...preferences,
                              preferred_days: preferences.preferred_days.filter(
                                (d) => d !== day
                              ),
                            });
                          } else {
                            setPreferences({
                              ...preferences,
                              preferred_days: [...preferences.preferred_days, day],
                            });
                          }
                        }}
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Serviços Favoritos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Banho", "Tosa", "Consulta", "Vacina", "Hotel", "Creche"].map(
                      (service) => (
                        <Badge
                          key={service}
                          variant={
                            preferences.favorite_services.includes(service)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            if (preferences.favorite_services.includes(service)) {
                              setPreferences({
                                ...preferences,
                                favorite_services:
                                  preferences.favorite_services.filter(
                                    (s) => s !== service
                                  ),
                              });
                            } else {
                              setPreferences({
                                ...preferences,
                                favorite_services: [
                                  ...preferences.favorite_services,
                                  service,
                                ],
                              });
                            }
                          }}
                        >
                          {service}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <Label>Canal de Comunicação Preferido</Label>
                  <Select
                    value={preferences.communication_preference}
                    onValueChange={(v) =>
                      setPreferences({ ...preferences, communication_preference: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Permitir lembretes automáticos</Label>
                    <Button
                      variant={preferences.allow_reminders ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          allow_reminders: !preferences.allow_reminders,
                        })
                      }
                    >
                      {preferences.allow_reminders ? "Sim" : "Não"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Receber promoções e ofertas</Label>
                    <Button
                      variant={preferences.allow_promotions ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          allow_promotions: !preferences.allow_promotions,
                        })
                      }
                    >
                      {preferences.allow_promotions ? "Sim" : "Não"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isCreating}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Cancelar
            </Button>

            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={isCreating}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="btn-gradient text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Finalizar Cadastro
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}