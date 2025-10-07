import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { GraduationCap, Target, Calendar, Loader2, Plus, CheckCircle } from "lucide-react";
import { useTrainingPlans, useCreateTrainingPlan, useUpdateTrainingPlan } from "@/hooks/useTraining";
import { useContacts } from "@/hooks/useContacts";
import { usePatients } from '@/hooks/usePatients';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TrainingPlans() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: plansData, isLoading } = useTrainingPlans(
    statusFilter === "all" ? {} : { status: statusFilter }
  );
  const createMutation = useCreateTrainingPlan();
  const updateMutation = useUpdateTrainingPlan();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const { data: petsData } = usePatients(selectedContactId);

  const [formData, setFormData] = useState({
    patient_id: "",
    contact_id: "",
    plan_type: "1x_semana" as "1x_semana" | "2x_semana" | "3x_semana",
    start_date: "",
    goals: [] as string[],
    notes: "",
    initial_assessment: {
      comportamento_atual: "",
      socializacao: "",
      comandos_conhecidos: "",
      problemas_especificos: "",
      ambiente_casa: "",
      historico_treino: "",
    },
  });

  const plans = plansData?.plans || [];
  const activePlans = plans.filter((p: any) => p.status === "active");
  const completedPlans = plans.filter((p: any) => p.status === "completed");

  const handleCreate = async () => {
    if (!formData.patient_id || !formData.start_date) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Selecione patient e data de início",
      });
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast({
        title: "✅ Plano criado!",
        description: "O plano de adestramento foi criado com sucesso",
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar plano",
      });
    }
  };

  const handleUpdateStatus = async (planId: string, status: string) => {
    try {
      await updateMutation.mutateAsync({ planId, updates: { status } });
      toast({
        title: "✅ Status atualizado",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      contact_id: "",
      plan_type: "1x_semana",
      start_date: "",
      goals: [],
      notes: "",
      initial_assessment: {
        comportamento_atual: "",
        socializacao: "",
        comandos_conhecidos: "",
        problemas_especificos: "",
        ambiente_casa: "",
        historico_treino: "",
      },
    });
    setSelectedContactId("");
  };

  const getPlanTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "1x_semana": "1x/semana",
      "2x_semana": "2x/semana",
      "3x_semana": "3x/semana",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { label: "Ativo", className: "bg-green-100 text-green-800" },
      completed: { label: "Concluído", className: "bg-blue-100 text-blue-800" },
      cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-800" },
    };
    const variant = variants[status] || variants.active;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Planos de Adestramento"
        subtitle="Gerencie planos de treino personalizados para cada patient"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Planos Ativos"
          value={activePlans.length}
          icon={GraduationCap}
          color="green"
        />
        <StatCard
          title="Planos Concluídos"
          value={completedPlans.length}
          icon={CheckCircle}
          color="blue"
        />
        <StatCard title="Total de Planos" value={plans.length} icon={Target} color="purple" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          Todos
        </Button>
        <Button
          variant={statusFilter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("active")}
        >
          Ativos
        </Button>
        <Button
          variant={statusFilter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("completed")}
        >
          Concluídos
        </Button>
      </div>

      {/* Plans List */}
      <Card>
        <CardHeader>
          <CardTitle>Planos ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-ocean-blue" />
            </div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum plano encontrado. Crie o primeiro! 🐕
            </p>
          ) : (
            <div className="space-y-4">
              {plans.map((plan: any) => (
                <div key={plan.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{plan.patient?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Tutor: {plan.contact?.full_name}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {getStatusBadge(plan.status)}
                      <Badge variant="secondary">{getPlanTypeLabel(plan.plan_type)}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Início:</p>
                      <p className="font-medium">
                        {new Date(plan.start_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequência:</p>
                      <p className="font-medium">{plan.frequency}x/semana</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sessões Planejadas:</p>
                      <p className="font-medium">{plan.total_sessions || 12}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Criado:</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(plan.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>

                  {plan.goals && plan.goals.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">🎯 Objetivos:</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.goals.map((goal: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {plan.status === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(plan.id, "completed")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(plan.id, "cancelled")}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Plano de Adestramento</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar um plano personalizado
            </DialogDescription>
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
                    {petsData?.map((patient: any) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequência *</Label>
                <Select
                  value={formData.plan_type}
                  onValueChange={(value: any) => setFormData({ ...formData, plan_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x_semana">1x por semana</SelectItem>
                    <SelectItem value="2x_semana">2x por semana</SelectItem>
                    <SelectItem value="3x_semana">3x por semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais sobre o plano..."
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
                  "Criar Plano"
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
