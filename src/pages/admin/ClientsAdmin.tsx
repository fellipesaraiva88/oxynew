import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Loader2,
  Building2,
  Activity,
  MessageSquare,
  ChevronRight,
  Plus,
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ClientManagementModal from '@/components/admin/ClientManagementModal';
import CreateClientModal from '@/components/admin/CreateClientModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ClientMetrics {
  instances_count: number;
  messages_today: number;
  quota_usage_pct: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  is_active: boolean;
  subscription_plan: string;
  subscription_status: string;
  quota_messages_monthly: number;
  quota_instances: number;
  metrics: ClientMetrics;
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-blue-100 text-blue-800',
  pro: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-orange-100 text-orange-800',
};

export default function ClientsAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/internal/clients`, { withCredentials: true });

      setClients(response.data.clients);
      setFilteredClients(response.data.clients);
    } catch (error: any) {
      console.error('Error fetching clients:', error);

      if (error.response?.status === 401) {
        navigate('/admin/login');
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao carregar clientes',
        description: error.response?.data?.error || 'Tente novamente',
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.is_active).length,
    totalInstances: clients.reduce((acc, c) => acc + c.metrics.instances_count, 0),
    totalMessagesToday: clients.reduce((acc, c) => acc + c.metrics.messages_today, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie todas as organizações da plataforma</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-ocean-blue" />
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.active} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Instâncias Conectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-bold">{stats.totalInstances}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mensagens Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <p className="text-2xl font-bold">{stats.totalMessagesToday.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Ativação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.round((stats.active / stats.total) * 100)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="text-center">Instâncias</TableHead>
              <TableHead className="text-center">Msgs Hoje</TableHead>
              <TableHead className="text-center">Uso</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow 
                key={client.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  setSelectedClient(client);
                  setIsModalOpen(true);
                }}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={PLAN_COLORS[client.subscription_plan] || ''}>
                    {PLAN_LABELS[client.subscription_plan] || client.subscription_plan}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{client.metrics.instances_count}</span>
                  <span className="text-muted-foreground">/{client.quota_instances}</span>
                </TableCell>
                <TableCell className="text-center">
                  {client.metrics.messages_today.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={client.metrics.quota_usage_pct > 80 ? 'destructive' : 'secondary'}
                  >
                    {client.metrics.quota_usage_pct}%
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Badge variant={client.is_active ? 'default' : 'secondary'}>
                    {client.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedClient(client);
                      setIsModalOpen(true);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Client Management Modal */}
      <ClientManagementModal
        client={selectedClient}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(null);
        }}
        onRefresh={fetchClients}
      />

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchClients}
      />
    </div>
  );
}
