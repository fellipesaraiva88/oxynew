import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, DollarSign, CheckCircle, Bot, Loader2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useContacts } from "@/hooks/useContacts";
import { bookingsService } from "@/services/bookings.service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarView } from "@/components/CalendarView";
import { BookingFormModal } from "@/components/bookings/BookingFormModal";

export default function Agenda() {
  const { toast } = useToast();
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Buscar todos os appointments (sem filtro de data para mostrar no calendário)
  const { appointments, isLoading, refetch } = useBookings({});
  const { contacts } = useContacts();

  // Filtrar appointments de hoje para stats
  const today = format(new Date(), "yyyy-MM-dd");
  const todayBookings = appointments.filter((b) => {
    const bookingDate = format(new Date(b.scheduled_start || b.scheduledFor), "yyyy-MM-dd");
    return bookingDate === today;
  });

  const totalRevenue = todayBookings.reduce((sum, apt) => sum + (apt.price || 0), 0);
  const confirmedBookings = todayBookings.filter(b => b.status === "confirmed").length;
  const aiBookings = todayBookings.filter(b => b.notes?.includes("IA") || b.created_by_ai).length;

  const handleCreateBooking = async (data: any) => {
    setIsCreating(true);
    try {
      await bookingsService.create(data);

      toast({
        title: "✅ Agendamento criado!",
        description: "Serviço agendado com sucesso",
      });

      setIsNewBookingOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar agendamento",
        description: error.response?.data?.error || "Tente novamente",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handler para quando um evento é clicado
  const handleSelectEvent = (event: any) => {
    setSelectedBooking(event.resource);
    setIsDetailsOpen(true);
  };

  // Handler para drag-and-drop de eventos
  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      await bookingsService.update(event.id, {
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
      });

      toast({
        title: "✅ Reagendado!",
        description: "Horário alterado com sucesso",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao reagendar",
        description: error.response?.data?.error || "Tente novamente",
      });
    }
  };

  return (
    <div className="p-3 md:p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Agenda"
        subtitle="Gerencie todos os agendamentos"
        actions={
          <Button
            className="btn-gradient text-white text-xs md:text-sm min-h-[44px] md:min-h-0"
            size="sm"
            onClick={() => setIsNewBookingOpen(true)}
          >
            <CalendarIcon className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>
        }
      />

      {/* Novo Modal de Agendamento */}
      <BookingFormModal
        open={isNewBookingOpen}
        onOpenChange={setIsNewBookingOpen}
        contacts={contacts}
        onSubmit={handleCreateBooking}
        isLoading={isCreating}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <StatCard
          icon={CalendarIcon}
          title="Agendamentos Hoje"
          value={isLoading ? "-" : todayBookings.length}
          subtitle="Total do dia"
        />
        <StatCard
          icon={CheckCircle}
          title="Confirmados"
          value={isLoading ? "-" : confirmedBookings}
          subtitle="Aguardando atendimento"
        />
        <StatCard
          icon={DollarSign}
          title="Receita do Dia"
          value={isLoading ? "-" : `R$ ${totalRevenue.toFixed(2)}`}
          subtitle="Valor total"
        />
        <StatCard
          icon={Bot}
          title="Criados pela IA"
          value={isLoading ? "-" : aiBookings}
          subtitle="Automáticos"
        />
      </div>

      {/* Calendário Visual Completo */}
      <Card className="glass-card">
        <CardContent className="p-3 md:p-4 lg:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 md:py-24">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-ocean-blue animate-spin" />
            </div>
          ) : (
            <CalendarView
              appointments={appointments}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              defaultView="month"
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog Detalhes do Agendamento */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações completas do serviço agendado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedBooking && (
              <>
                {/* Info do Agendamento */}
                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{selectedBooking.patient?.name || "Patient"}</h4>
                    {selectedBooking.notes?.includes("IA") || selectedBooking.created_by_ai ? (
                      <Badge variant="secondary" className="gap-1">
                        <Bot className="w-3 h-3" />
                        IA
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <User className="w-3 h-3" />
                        Manual
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cliente</p>
                      <p className="font-medium">{selectedBooking.clientName || "Cliente"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Serviço</p>
                      <p className="font-medium">
                        {selectedBooking.service_type?.replace("_", " ").toUpperCase() || "Serviço"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.scheduled_start || selectedBooking.scheduledFor), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Horário</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.scheduled_start || selectedBooking.scheduledFor), "HH:mm")}
                        {selectedBooking.scheduled_end &&
                          ` - ${format(new Date(selectedBooking.scheduled_end), "HH:mm")}`
                        }
                      </p>
                    </div>
                    {selectedBooking.price && (
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-medium text-green-600">R$ {selectedBooking.price.toFixed(2)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          selectedBooking.status === "confirmed"
                            ? "default"
                            : selectedBooking.status === "pending"
                            ? "secondary"
                            : selectedBooking.status === "completed"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {selectedBooking.status === "confirmed"
                          ? "Confirmado"
                          : selectedBooking.status === "pending"
                          ? "Agendado"
                          : selectedBooking.status === "completed"
                          ? "Concluído"
                          : "Cancelado"}
                      </Badge>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div>
                      <p className="text-muted-foreground text-sm">Observações</p>
                      <p className="text-sm">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
