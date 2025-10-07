import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarIcon,
  Clock,
  User,
  Dog,
  Scissors,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Contact {
  id: string;
  full_name?: string;
  name?: string;
  phone_number?: string;
  patients?: Patient[];
}

interface Patient {
  id: string;
  name: string;
  gender_identity: 'male'|'female'|'other'|'prefer_not_to_say' | 'male'|'female'|'other'|'prefer_not_to_say';
  age_group?: string;
}

interface BookingSubmitData {
  contact_id: string;
  patient_id?: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  notes?: string;
}

interface BookingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onSubmit: (data: BookingSubmitData) => Promise<void>;
  isLoading?: boolean;
}

const SERVICES = [
  { id: "banho", name: "Banho", icon: "🛁", duration: 60, color: "bg-blue-500" },
  { id: "tosa", name: "Banho e Tosa", icon: "✂️", duration: 90, color: "bg-purple-500" },
  { id: "hotel", name: "Hotel", icon: "🏨", duration: 1440, color: "bg-green-500" },
  { id: "consulta", name: "Consulta", icon: "🩺", duration: 30, color: "bg-red-500" },
  { id: "vacina", name: "Vacinação", icon: "💉", duration: 20, color: "bg-yellow-500" },
  { id: "adestramento", name: "Adestramento", icon: "🎓", duration: 60, color: "bg-indigo-500" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
];

export function BookingFormModal({
  open,
  onOpenChange,
  contacts,
  onSubmit,
  isLoading = false,
}: BookingFormModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    contact_id: "",
    patient_id: "",
    service_id: "",
    date: new Date(),
    time: "",
    notes: "",
  });
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactPets, setContactPets] = useState<Patient[]>([]);
  const [calculatedEndTime, setCalculatedEndTime] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setFormData({
        contact_id: "",
        patient_id: "",
        service_id: "",
        date: new Date(),
        time: "",
        notes: "",
      });
      setSelectedContact(null);
      setContactPets([]);
    }
  }, [open]);

  // Load patients when contact is selected
  useEffect(() => {
    if (formData.contact_id) {
      const contact = contacts.find((c) => c.id === formData.contact_id);
      setSelectedContact(contact);
      // In real app, fetch patients from API
      setContactPets(contact?.patients || []);
    }
  }, [formData.contact_id, contacts]);

  // Calculate end time based on service duration
  useEffect(() => {
    if (formData.service_id && formData.time) {
      const service = SERVICES.find((s) => s.id === formData.service_id);
      if (service) {
        const [hours, minutes] = formData.time.split(":").map(Number);
        const startDate = setMinutes(setHours(formData.date, hours), minutes);
        const endDate = addMinutes(startDate, service.duration);
        setCalculatedEndTime(format(endDate, "HH:mm"));
      }
    }
  }, [formData.service_id, formData.time, formData.date]);

  const selectedService = SERVICES.find((s) => s.id === formData.service_id);

  const handleSubmit = async () => {
    if (!formData.contact_id || !formData.service_id || !formData.time) {
      return;
    }

    const [hours, minutes] = formData.time.split(":").map(Number);
    const startDate = setMinutes(setHours(formData.date, hours), minutes);
    const service = SERVICES.find((s) => s.id === formData.service_id);
    const endDate = addMinutes(startDate, service?.duration || 60);

    await onSubmit({
      contact_id: formData.contact_id,
      patient_id: formData.patient_id || undefined,
      service_id: formData.service_id,
      scheduled_start: startDate.toISOString(),
      scheduled_end: endDate.toISOString(),
      notes: formData.notes || undefined,
    });
  };

  const canProceedToStep2 = formData.contact_id && formData.service_id;
  const canProceedToStep3 = canProceedToStep2 && formData.time;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Novo Agendamento
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo agendamento
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 transition-all",
                    step > s ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 px-1">
          <AnimatePresence mode="wait">
            {/* Step 1: Cliente e Serviço */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 p-4"
              >
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Selecione o Cliente *
                  </Label>
                  <Select
                    value={formData.contact_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, contact_id: value, patient_id: "" })
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Escolha um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {contact.full_name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="font-medium">{contact.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {contact.phone_number}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedContact && contactPets.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Dog className="w-4 h-4" />
                      Patient (opcional)
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {contactPets.map((patient) => (
                        <Card
                          key={patient.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            formData.patient_id === patient.id
                              ? "ring-2 ring-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => setFormData({ ...formData, patient_id: patient.id })}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">{patient.gender_identity === "dog" ? "🐕" : "🐈"}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{patient.name}</div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {patient.age_group || patient.gender_identity}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    Escolha o Serviço *
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICES.map((service) => (
                      <Card
                        key={service.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          formData.service_id === service.id
                            ? "ring-2 ring-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => setFormData({ ...formData, service_id: service.id })}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className="text-3xl">{service.icon}</div>
                            <div className="font-semibold">{service.name}</div>
                            <Badge variant="secondary" className="text-xs">
                              {service.duration >= 60
                                ? `${service.duration / 60}h`
                                : `${service.duration}min`}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Data e Horário */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 p-4"
              >
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Selecione a Data
                  </Label>
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    locale={ptBR}
                    className="rounded-md border mx-auto"
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Escolha o Horário *
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((time) => (
                      <Button
                        key={time}
                        variant={formData.time === time ? "default" : "outline"}
                        className={cn(
                          "h-12",
                          formData.time === time && "ring-2 ring-primary ring-offset-2"
                        )}
                        onClick={() => setFormData({ ...formData, time })}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                {formData.time && selectedService && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Duração</div>
                          <div className="font-semibold">
                            {selectedService.duration >= 60
                              ? `${selectedService.duration / 60}h`
                              : `${selectedService.duration}min`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Término previsto</div>
                          <div className="font-semibold">{calculatedEndTime}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Step 3: Confirmação */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 p-4"
              >
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-5 h-5" />
                      <h3 className="font-semibold text-lg">Resumo do Agendamento</h3>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cliente</span>
                        <span className="font-semibold">{selectedContact?.full_name}</span>
                      </div>
                      {formData.patient_id && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Patient</span>
                          <span className="font-semibold">
                            {contactPets.find((p) => p.id === formData.patient_id)?.name}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serviço</span>
                        <span className="font-semibold">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data</span>
                        <span className="font-semibold">
                          {format(formData.date, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Horário</span>
                        <span className="font-semibold">
                          {formData.time} - {calculatedEndTime}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Observações (opcional)</Label>
                  <Textarea
                    placeholder="Ex: Cliente preferencial, patient nervoso, alergias..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isLoading}>
              Voltar
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedToStep2 : !canProceedToStep3}
              className="min-w-[120px]"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="min-w-[120px] btn-gradient text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

