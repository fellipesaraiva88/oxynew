import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Send, Camera, Star, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  stay_id: string;
  pet_name: string;
  contact_name: string;
  contact_phone: string;
  behavior_rating: number;
  appetite_rating: number;
  socialization_rating: number;
  notes: string;
  photos_count: number;
  created_at: string;
}

interface DaycareReportsProps {
  reports: Report[];
  onSendReport?: (stayId: string) => Promise<void>;
}

export function DaycareReports({ reports, onSendReport }: DaycareReportsProps) {
  const [sendingReportId, setSendingReportId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendReport = async (stayId: string) => {
    if (!onSendReport) return;

    setSendingReportId(stayId);
    try {
      await onSendReport(stayId);
      toast({
        title: "✅ Relatório Enviado",
        description: "O tutor recebeu o relatório via WhatsApp",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar relatório",
      });
    } finally {
      setSendingReportId(null);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Relatórios para Tutores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum relatório pendente de envio
          </p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg p-4 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/10 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{report.pet_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Tutor: {report.contact_name}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {report.photos_count} {report.photos_count === 1 ? 'foto' : 'fotos'}
                  </Badge>
                </div>

                {/* Avaliações */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Comportamento</p>
                    <div className="flex gap-0.5">{getRatingStars(report.behavior_rating)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Apetite</p>
                    <div className="flex gap-0.5">{getRatingStars(report.appetite_rating)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Socialização</p>
                    <div className="flex gap-0.5">{getRatingStars(report.socialization_rating)}</div>
                  </div>
                </div>

                {/* Notas */}
                {report.notes && (
                  <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded border">
                    <p className="text-xs text-muted-foreground mb-1">Observações:</p>
                    <p className="text-sm">{report.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSendReport(report.stay_id)}
                    disabled={sendingReportId === report.stay_id}
                  >
                    {sendingReportId === report.stay_id ? (
                      <>
                        <Send className="w-4 h-4 mr-2 animate-pulse" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar via WhatsApp
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-4 pt-4 border-t flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            Relatórios são enviados automaticamente via WhatsApp ao final da estadia.
            Você pode enviar manualmente a qualquer momento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
