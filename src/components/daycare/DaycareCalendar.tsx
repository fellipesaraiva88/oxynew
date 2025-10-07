import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DaycareStay {
  id: string;
  pet_name: string;
  contact_name: string;
  stay_type: 'daycare' | 'hotel';
  check_in_date: string;
  check_out_date: string | null;
  status: string;
}

interface DaycareCalendarProps {
  stays: DaycareStay[];
}

export function DaycareCalendar({ stays }: DaycareCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getStaysForDay = (date: Date) => {
    return stays.filter((stay) => {
      const checkIn = new Date(stay.check_in_date);
      const checkOut = stay.check_out_date ? new Date(stay.check_out_date) : null;

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      if (checkOut) {
        return checkIn <= dayEnd && checkOut >= dayStart;
      } else {
        return checkIn <= dayEnd;
      }
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendário de Estadias
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium capitalize min-w-[150px] text-center">
              {monthName}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const staysForDay = getStaysForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={day.toISOString()}
                className={`
                  aspect-square border rounded-lg p-1 hover:shadow-md transition-shadow
                  ${isToday ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300' : 'bg-card'}
                  ${staysForDay.length > 0 ? 'border-green-300 bg-green-50/50 dark:bg-green-950/10' : ''}
                `}
              >
                <div className="text-xs font-medium text-center mb-1">
                  {day.getDate()}
                </div>

                {staysForDay.length > 0 && (
                  <div className="space-y-0.5">
                    {staysForDay.slice(0, 2).map((stay) => (
                      <div
                        key={stay.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate ${
                          stay.stay_type === 'hotel'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                        }`}
                        title={`${stay.pet_name} - ${stay.contact_name}`}
                      >
                        {stay.pet_name}
                      </div>
                    ))}
                    {staysForDay.length > 2 && (
                      <div className="text-[9px] text-center text-muted-foreground">
                        +{staysForDay.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>Creche</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
            <span>Hotel</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-blue-50 border border-blue-300"></div>
            <span>Hoje</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
