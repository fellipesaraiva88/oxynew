import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Filter } from "lucide-react";
import {
  useDaycareStays,
  useCreateDaycareStay,
  useUpdateDaycareStay,
  useStayUpsells,
  useStayTimeline,
  usePendingReports,
} from "@/hooks/useDaycare";
import { usePatients } from '@/hooks/usePatients';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Import new components
import { DaycareDashboard } from "@/components/daycare/DaycareDashboard";
import { DaycareCalendar } from "@/components/daycare/DaycareCalendar";
import { DaycareTimeline } from "@/components/daycare/DaycareTimeline";
import { DaycareReports } from "@/components/daycare/DaycareReports";
import { UpsellRecommendations } from "@/components/daycare/UpsellRecommendations";

// Types
interface DaycareStay {
  id: string;
  patient_id: string;
  contact_id: string;
  stay_type: "daycare" | "hotel";
  status: string;
  check_in_date: string;
  check_out_date?: string;
  created_at: string;
  health_assessment?: {
    vacinas?: boolean;
    vermifugo?: boolean;
  };
  extra_services?: string[];
  patient?: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    full_name: string;
  };
}

interface Patient {
  id: string;
  name: string;
}

interface StayFilters {
  status?: string;
  stayType?: string;
}

interface StatusBadgeVariant {
  label: string;
  className: string;
}

export default function DaycareStays() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filters: StayFilters = {};
  if (statusFilter !== "all") filters.status = statusFilter;
  if (typeFilter !== "all") filters.stayType = typeFilter;

  const { data: staysData, isLoading } = useDaycareStays(filters);
  const createMutation = useCreateDaycareStay();
  const updateMutation = useUpdateDaycareStay();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const { data: petsData } = usePatients(selectedContactId);

  const [formData, setFormData] = useState({
    patient_id: "",
    contact_id: "",
    stay_type: "daycare" as "daycare" | "hotel",
    check_in_date: "",
    check_out_date: "",
    notes: "",
    health_assessment: {
      vacinas: false,
      vermifugo: false,
      exames: [] as string[],
      restricoes_alimentares: [] as string[],
    },
    behavior_assessment: {
      socializacao: "",
      ansiedade: "",
      energia: "",
      teste_adaptacao: "",
    },
    extra_services: [] as string[],
  });

  const stays: DaycareStay[] = staysData?.stays || [];
  const activeStays = stays.filter((s: DaycareStay) => s.status === "em_estadia");
  const pendingStays = stays.filter((s: DaycareStay) => s.status === "aguardando_avaliacao");
  const todayCheckIns = stays.filter((s: DaycareStay) => {
    const checkIn = new Date(s.check_in_date);
    const today = new Date();
    return checkIn.toDateString() === today.toDateString();
  }).length;
  const todayCheckOuts = stays.filter((s: DaycareStay) => {
    if (!s.check_out_date) return false;
    const checkOut = new Date(s.check_out_date);
    const today = new Date();
    return checkOut.toDateString() === today.toDateString();
  }).length;

  // Dashboard stats
  const daycareCapacity = 20; // TODO: Get from settings
  const hotelCapacity = 10; // TODO: Get from settings
  const daycareOccupied = stays.filter(
    (s: DaycareStay) => s.stay_type === "daycare" && s.status === "em_estadia"
  ).length;
  const hotelOccupied = stays.filter(
    (s: DaycareStay) => s.stay_type === "hotel" && s.status === "em_estadia"
  ).length;
  const occupancyRate =
    ((daycareOccupied + hotelOccupied) / (daycareCapacity + hotelCapacity)) * 100;

  const dashboardStats = {
    totalStays: stays.length,
    activeStays: activeStays.length,
    pendingApproval: pendingStays.length,
    todayCheckIns,
    todayCheckOuts,
    occupancyRate,
    daycareCapacity,
    hotelCapacity,
    daycareOccupied,
    hotelOccupied,
  };

  // Real data from hooks
  const { data: pendingReports } = usePendingReports();

  // Timeline and upsells for selected stay
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const { data: timelineData } = useStayTimeline(selectedStayId);
  const { data: upsellData } = useStayUpsells(selectedStayId);

  const reports = pendingReports || [];
  const upsellSuggestions = upsellData?.suggestions || [];

  // Transform timeline data to component format
  const timelineEvents = (timelineData || []).map((event: any) => ({
    id: event.id,
    time: new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    type: event.activity_type,
    description: event.description,
    pet_name: event.pet_name || 'Patient',
    completed: true,
    photo_url: event.photo_url,
  }));

  const handleCreate = async () => {
    if (!formData.patient_id || !formData.check_in_date) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Selecione patient e data de check-in",
      });
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast({
        title: "✅ Estadia criada!",
        description: "A estadia foi registrada com sucesso",
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar estadia",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      contact_id: "",
      stay_type: "daycare",
      check_in_date: "",
      check_out_date: "",
      notes: "",
      health_assessment: {
        vacinas: false,
        vermifugo: false,
        exames: [],
        restricoes_alimentares: [],
      },
      behavior_assessment: {
        socializacao: "",
        ansiedade: "",
        energia: "",
        teste_adaptacao: "",
      },
      extra_services: [],
    });
    setSelectedContactId("");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, StatusBadgeVariant> = {
      aguardando_avaliacao: { label: "Aguardando", className: "bg-yellow-100 text-yellow-800" },
      aprovado: { label: "Aprovado", className: "bg-green-100 text-green-800" },
      em_estadia: { label: "Em Estadia", className: "bg-blue-100 text-blue-800" },
      finalizado: { label: "Finalizado", className: "bg-gray-100 text-gray-800" },
      cancelado: { label: "Cancelado", className: "bg-red-100 text-red-800" },
    };
    const variant = variants[status] || variants.aguardando_avaliacao;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Hotelzinho & Creche"
        subtitle="Gestão completa de estadias com relatórios e upsells inteligentes"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Estadia
          </Button>
        }
      />

      {/* Dashboard Stats */}
      <DaycareDashboard stats={dashboardStats} />

      {/* Main Content - Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="timeline">Rotina</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="upsells">Upsells</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="aguardando_avaliacao">Aguardando</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_estadia">Em Estadia</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="daycare">Creche</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Stays List */}
          <Card>
            <CardHeader>
              <CardTitle>Estadias ({stays.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-ocean-blue" />
                </div>
              ) : stays.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma estadia encontrada 🏠
                </p>
              ) : (
                <div className="space-y-4">
                  {stays.map((stay: DaycareStay) => (
                    <div
                      key={stay.id}
                      className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                        selectedStayId === stay.id ? 'ring-2 ring-ocean-blue' : ''
                      }`}
                      onClick={() => setSelectedStayId(stay.id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{stay.patient?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Tutor: {stay.contact?.full_name}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          {getStatusBadge(stay.status)}
                          <Badge variant={stay.stay_type === "hotel" ? "default" : "secondary"}>
                            {stay.stay_type === "hotel" ? "🏨 Hotel" : "🏠 Creche"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Check-in:</p>
                          <p className="font-medium">
                            {new Date(stay.check_in_date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Check-out:</p>
                          <p className="font-medium">
                            {stay.check_out_date
                              ? new Date(stay.check_out_date).toLocaleDateString("pt-BR")
                              : "Não definido"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vacinas:</p>
                          <p className="font-medium">
                            {stay.health_assessment?.vacinas ? "✅ OK" : "❌ Pendente"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Criado:</p>
                          <p className="font-medium">
                            {formatDistanceToNow(new Date(stay.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>

                      {stay.extra_services && stay.extra_services.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1">🎁 Serviços Extras:</p>
                          <div className="flex flex-wrap gap-1">
                            {stay.extra_services.map((service: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <DaycareCalendar
            stays={stays.map((s: DaycareStay) => ({
              id: s.id,
              pet_name: s.patient?.name || "Patient",
              contact_name: s.contact?.full_name || "Tutor",
              stay_type: s.stay_type,
              check_in_date: s.check_in_date,
              check_out_date: s.check_out_date,
              status: s.status,
            }))}
          />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <DaycareTimeline events={timelineEvents} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <DaycareReports reports={reports} />
        </TabsContent>

        {/* Upsells Tab */}
        <TabsContent value="upsells">
          <UpsellRecommendations suggestions={upsellSuggestions} />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Estadia</DialogTitle>
            <DialogDescription>Registre uma nova estadia de creche ou hotel</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Input
                  placeholder="ID do cliente"
                  value={formData.contact_id}
                  onChange={(e) => {
                    setFormData({ ...formData, contact_id: e.target.value });
                    setSelectedContactId(e.target.value);
                  }}
                />
              </div>

              <div>
                <Label>Patient *</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {petsData?.map((patient: Patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formData.stay_type}
                  onValueChange={(value: "daycare" | "hotel") => setFormData({ ...formData, stay_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daycare">Creche</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Check-in *</Label>
                <Input
                  type="date"
                  value={formData.check_in_date}
                  onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Check-out</Label>
                <Input
                  type="date"
                  value={formData.check_out_date}
                  onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avaliação de Saúde</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vacinas"
                    checked={formData.health_assessment.vacinas}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        health_assessment: {
                          ...formData.health_assessment,
                          vacinas: checked as boolean,
                        },
                      })
                    }
                  />
                  <label htmlFor="vacinas" className="text-sm">
                    Vacinas em dia
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vermifugo"
                    checked={formData.health_assessment.vermifugo}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        health_assessment: {
                          ...formData.health_assessment,
                          vermifugo: checked as boolean,
                        },
                      })
                    }
                  />
                  <label htmlFor="vermifugo" className="text-sm">
                    Vermífugo em dia
                  </label>
                </div>
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Estadia"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
