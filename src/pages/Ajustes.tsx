import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Building, Clock, Bell, Users, Shield } from "lucide-react";

export default function Ajustes() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Ajustes"
        subtitle="Configure as preferências do sistema"
        actions={
          <Button>
            <Settings className="w-4 h-4" />
            Salvar Alterações
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Informações da Empresa */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-ocean-blue" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Negócio</Label>
                <Input id="nome" defaultValue="Patient Love" />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" defaultValue="(11) 98765-4321" />
              </div>
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" defaultValue="Rua das Flores, 123 - Centro" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" defaultValue="São Paulo" />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input id="estado" defaultValue="SP" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horário de Funcionamento */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-ocean-blue" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label>Segunda a Sexta</Label>
              <Input defaultValue="08:00" type="time" />
              <Input defaultValue="18:00" type="time" />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label>Sábado</Label>
              <Input defaultValue="08:00" type="time" />
              <Input defaultValue="14:00" type="time" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Domingo</Label>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-ocean-blue" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novas conversas</p>
                <p className="text-sm text-muted-foreground">
                  Receber notificação quando um novo cliente entrar em contato
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Agendamentos</p>
                <p className="text-sm text-muted-foreground">
                  Notificar sobre novos agendamentos criados
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ações da IA</p>
                <p className="text-sm text-muted-foreground">
                  Receber resumo diário das ações executadas pela IA
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Equipe */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-ocean-blue" />
              Gestão de Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium">Maria Silva</p>
                  <p className="text-sm text-muted-foreground">maria@petlove.com</p>
                </div>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              + Adicionar Membro
            </Button>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-ocean-blue" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              Alterar Senha
            </Button>
            <Button variant="outline" className="w-full">
              Autenticação de Dois Fatores
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
