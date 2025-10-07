import { useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface Appointment {
  id: string;
  scheduled_start?: string;
  scheduledFor?: string;
  scheduled_end?: string;
  patient?: {
    name: string;
  };
  contact?: {
    full_name?: string;
    name?: string;
  };
  service_type?: string;
  service?: string;
  status: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment & { clientName: string };
}

interface CalendarViewProps {
  appointments: Appointment[];
  onSelectEvent: (event: CalendarEvent) => void;
  onEventDrop: (event: { event: CalendarEvent; start: Date; end: Date }) => void;
  defaultView?: View;
}

export function CalendarView({
  appointments,
  onSelectEvent,
  onEventDrop,
  defaultView = "month",
}: CalendarViewProps) {
  // Converter appointments para eventos do calendário
  const events = useMemo<CalendarEvent[]>(() => {
    return appointments.map((appointment) => {
      const start = new Date(appointment.scheduled_start || appointment.scheduledFor);
      const end = new Date(appointment.scheduled_end || start);

      // Título com nome do patient e serviço
      const petName = appointment.patient?.name || "Patient";
      const clientName = appointment.contact?.full_name || appointment.contact?.name || "Cliente";
      const service = appointment.service_type?.replace("_", " ").toUpperCase() || appointment.service || "Serviço";

      return {
        id: appointment.id,
        title: `${petName} - ${service}`,
        start,
        end,
        resource: {
          ...appointment,
          clientName,
        },
      };
    });
  }, [appointments]);

  // Estilizar eventos baseado no status
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = "#3b82f6"; // default: blue
    let borderColor = "#2563eb";

    switch (status) {
      case "confirmed":
        backgroundColor = "#3b82f6"; // blue
        borderColor = "#2563eb";
        break;
      case "pending":
        backgroundColor = "#f59e0b"; // amber
        borderColor = "#d97706";
        break;
      case "completed":
        backgroundColor = "#10b981"; // green
        borderColor = "#059669";
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // red
        borderColor = "#dc2626";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "6px",
        opacity: status === "cancelled" ? 0.6 : 1,
        color: "white",
        fontSize: "0.75rem", // Reduzido para mobile (12px)
        padding: "2px 6px", // Padding menor para mobile
        cursor: "pointer",
      },
    };
  }, []);

  // Handler para drag-and-drop
  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      onEventDrop({ event, start, end });
    },
    [onEventDrop]
  );

  // Mensagens em português
  const messages = {
    allDay: "Dia todo",
    previous: "Anterior",
    next: "Próximo",
    today: "Hoje",
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    date: "Data",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "Nenhum agendamento neste período",
    showMore: (total: number) => `+ (${total}) mais`,
  };

  return (
    <div className="calendar-container h-[500px] md:h-[600px] lg:h-[650px]">
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={defaultView}
        views={["month", "week", "agenda"]}
        messages={messages}
        culture="pt-BR"
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventStyleGetter}
        onEventDrop={handleEventDrop}
        draggableAccessor={() => true}
        resizable
        style={{ height: "100%" }}
        popup
      />
    </div>
  );
}
