import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Activity,
  Users,
  MessageSquare,
  Settings,
  CreditCard,
  History,
  ShieldAlert,
  QrCode,
  Key,
  UserPlus,
  Trash2,
  Edit,
  Save,
  X,
  RefreshCw,
  Ban,
  CheckCircle2,
  Eye,
  DollarSign,
  Phone,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';

const handleError = (error: unknown, title: string) => {
  let errorMessage = "Tente novamente";
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    errorMessage = error.response.data.error;
  }
  toast.error(title + ': ' + errorMessage);
};

interface ClientUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  status: string;
  connected_at?: string;
}

interface AuditLog {
  id: string;
  admin_name: string;
  action_type: string;
  action_details?: string;
  created_at: string;
}

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  is_active: boolean;
  subscription_plan: string;
  quota_messages_monthly: number;
  metrics: {
    messages_today: number;
    messages_month: number;
    active_conversations: number;
    instances_count: number;
    quota_usage_pct: number;
  };
}

interface ClientManagementModalProps {
  client: ClientData | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ClientManagementModal({
  client,
  isOpen,
  onClose,
  onRefresh,
}: ClientManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Client data state
  const [editedClient, setEditedClient] = useState<Partial<ClientData>>({});

  // Users state
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', fullName: '', role: 'user' });

  // WhatsApp state
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [pairingCode, setPairingCode] = useState('');

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Financial state
  const [selectedPlan, setSelectedPlan] = useState('');
  const [creditAmount, setCreditAmount] = useState('');

  useEffect(() => {
    if (client) {
      setEditedClient({
        name: client.name,
        email: client.email,
        phone: client.phone,
      });
      setSelectedPlan(client.subscription_plan);
      loadClientDetails();
    }
  }, [client, loadClientDetails]);

  const loadClientDetails = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');

      // Load users
      const usersRes = await apiClient.get(
        `/api/internal/client-management/clients/${client.id}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(usersRes.data.users || []);

      // Load audit history
      const auditRes = await apiClient.get(
        `/api/internal/client-management/clients/${client.id}/audit-history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAuditLogs(auditRes.data.auditHistory || []);
    } catch (error: unknown) {
      handleError(error, 'Error loading client details');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const handleSaveClient = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await apiClient.patch(
        `/api/internal/client-management/clients/${client.id}`,
        editedClient,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Cliente atualizado com sucesso!');
      setIsEditing(false);
      onRefresh();
    } catch (error: unknown) {
      handleError(error, 'Erro ao atualizar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!client || !newUser.email || !newUser.fullName) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await apiClient.post(
        `/api/internal/client-management/clients/${client.id}/users`,
        newUser,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Usuário criado! Senha gerada: ${res.data.generatedPassword}`);
      setShowAddUser(false);
      setNewUser({ email: '', fullName: '', role: 'user' });
      loadClientDetails();
    } catch (error: unknown) {
      handleError(error, 'Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await apiClient.delete(
        `/api/internal/client-management/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Usuário removido com sucesso!');
      loadClientDetails();
    } catch (error: unknown) {
      handleError(error, 'Erro ao remover usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await apiClient.post(
        `/api/internal/client-management/users/${userId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Nova senha gerada: ${res.data.password}`);
    } catch (error: unknown) {
      handleError(error, 'Erro ao resetar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await apiClient.post(
        `/api/internal/client-management/clients/${client.id}/whatsapp/generate-qr`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQrCode(res.data.qr);
      setPairingCode(res.data.pairingCode || '');
      toast.success('QR Code gerado com sucesso!');
    } catch (error: unknown) {
      handleError(error, 'Erro ao gerar QR Code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await apiClient.post(
        `/api/internal/client-management/clients/${client.id}/impersonate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { impersonationToken, redirectUrl } = res.data;

      // Open in new tab
      window.open(`${redirectUrl}?impersonation_token=${impersonationToken}`, '_blank');
      toast.success('Sessão de impersonation iniciada!');
    } catch (error: unknown) {
      handleError(error, 'Erro ao iniciar impersonation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!client) return;

    const action = client.is_active ? 'archive' : 'restore';
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await apiClient.post(
        `/api/internal/client-management/clients/${client.id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(client.is_active ? 'Cliente arquivado!' : 'Cliente restaurado!');
      onRefresh();
    } catch (error: unknown) {
      handleError(error, 'Erro ao alterar status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePermanently = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await apiClient.delete(
        `/api/internal/client-management/clients/${client.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { confirmation: 'DELETE_PERMANENTLY' }
        }
      );

      toast.success('Cliente deletado permanentemente!');
      setShowDeleteDialog(false);
      onClose();
      onRefresh();
    } catch (error: unknown) {
      handleError(error, 'Erro ao deletar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!client || selectedPlan === client.subscription_plan) {
      toast.info('Selecione um plano diferente');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await apiClient.patch(
        `/api/internal/client-management/clients/${client.id}`,
        { subscription_plan: selectedPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Plano alterado para ${selectedPlan.toUpperCase()}!`);
      onRefresh();
    } catch (error: unknown) {
      handleError(error, 'Erro ao alterar plano');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInjectCredits = async () => {
    const amount = parseInt(creditAmount);
    if (!amount || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await apiClient.patch(
        `/api/internal/client-management/clients/${client.id}`,
        { quota_messages_monthly: (client.quota_messages_monthly || 0) + amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${amount} créditos injetados!`);
      setCreditAmount('');
      onRefresh();
    } catch (error: unknown) {
      handleError(error, 'Erro ao injetar créditos');
    } finally {
      setIsLoading(false);
    }
  };

  if (!client) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  {client.name}
                  {client.is_active ? (
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Inativo</Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="space-y-1">
                  <div>{client.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Cliente desde {format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </DialogDescription>
              </div>
              <Badge className="text-lg px-4 py-2">
                {client.subscription_plan?.toUpperCase() || 'FREE'}
              </Badge>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">
                <Activity className="w-4 h-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="whatsapp">
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="financial">
                <CreditCard className="w-4 h-4 mr-2" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="audit">
                <History className="w-4 h-4 mr-2" />
                Auditoria
              </TabsTrigger>
              <TabsTrigger value="actions">
                <ShieldAlert className="w-4 h-4 mr-2" />
                Ações Admin
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Visão Geral 360° */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-xs">Mensagens Hoje</span>
                    </div>
                    <p className="text-2xl font-bold text-ocean-blue">
                      {client.metrics.messages_today}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Activity className="w-5 h-5" />
                      <span className="text-xs">Uso da Quota</span>
                    </div>
                    <p className="text-2xl font-bold text-ocean-blue">
                      {client.metrics.quota_usage_pct}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Users className="w-5 h-5" />
                      <span className="text-xs">Conversas Ativas</span>
                    </div>
                    <p className="text-2xl font-bold text-ocean-blue">
                      {client.metrics.active_conversations}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Phone className="w-5 h-5" />
                      <span className="text-xs">Instâncias</span>
                    </div>
                    <p className="text-2xl font-bold text-ocean-blue">
                      {client.metrics.instances_count}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resumo Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mensagens este mês:</span>
                      <span className="font-medium">{client.metrics.messages_month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Quota mensal:</span>
                      <span className="font-medium">{client.quota_messages_monthly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Usuários:</span>
                      <span className="font-medium">{users.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Editar Dados */}
            <TabsContent value="edit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dados da Organização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Organização</Label>
                      <Input
                        value={editedClient.name || ''}
                        onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={editedClient.email || ''}
                        onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={editedClient.phone || ''}
                        onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleSaveClient} disabled={isLoading}>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setIsEditing(false);
                          setEditedClient({
                            name: client.name,
                            email: client.email,
                            phone: client.phone,
                          });
                        }}>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Gestão de Usuários */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Usuários da Organização</CardTitle>
                  <Button size="sm" onClick={() => setShowAddUser(!showAddUser)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                </CardHeader>
                <CardContent>
                  {showAddUser && (
                    <Card className="mb-4 bg-accent">
                      <CardContent className="pt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Nome Completo</Label>
                            <Input
                              value={newUser.fullName}
                              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                              placeholder="João Silva"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              placeholder="joao@exemplo.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Papel</Label>
                            <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="guardian">Guardian</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button onClick={handleAddUser} disabled={isLoading}>
                          Criar Usuário
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge>{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleResetPassword(user.id)}>
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRemoveUser(user.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: WhatsApp */}
            <TabsContent value="whatsapp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Conexão WhatsApp</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleGenerateQR} disabled={isLoading}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar QR Code / Pairing Code
                  </Button>

                  {qrCode && (
                    <div className="space-y-2">
                      <img src={qrCode} alt="QR Code" className="max-w-xs border rounded" />
                      {pairingCode && (
                        <div className="p-3 bg-accent rounded">
                          <p className="text-sm font-medium">Pairing Code:</p>
                          <p className="text-2xl font-mono">{pairingCode}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: Financeiro */}
            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Gerenciar Plano</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter - R$ 97/mês</SelectItem>
                        <SelectItem value="pro">Pro - R$ 297/mês</SelectItem>
                        <SelectItem value="enterprise">Enterprise - R$ 997/mês</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleChangePlan} disabled={isLoading}>
                      Atualizar Plano
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Injetar Créditos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder="Quantidade"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                    <Button onClick={handleInjectCredits} disabled={isLoading}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Injetar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Adiciona mensagens extras à quota mensal sem custo
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 6: Histórico de Auditoria */}
            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Histórico de Ações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Detalhes</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.admin_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.action_details || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 7: Ações Admin */}
            <TabsContent value="actions" className="space-y-4">
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-sm text-purple-900">Ações Administrativas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleImpersonate} className="w-full justify-start" disabled={isLoading}>
                    <Eye className="w-4 h-4 mr-2" />
                    Impersonate (Entrar como Cliente)
                  </Button>

                  <Button
                    onClick={handleToggleStatus}
                    variant={client.is_active ? 'destructive' : 'default'}
                    className="w-full justify-start"
                    disabled={isLoading}
                  >
                    {client.is_active ? (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Suspender Cliente
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Reativar Cliente
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar Permanentemente
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente a organização
              <strong> {client.name}</strong>, todos os usuários, instâncias WhatsApp, mensagens e dados relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePermanently} className="bg-red-600">
              Deletar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
