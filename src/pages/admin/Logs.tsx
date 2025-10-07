import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DetailModal } from '@/components/admin/DetailModal';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Logs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [selectedLog, setSelectedLog] = useState<Record<string, unknown> | null>(null);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);

      const { data } = await axios.get(`${API_URL}/api/internal/logs/audit?${params}`, { withCredentials: true });

      setLogs(data.logs);
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 401) {
          navigate('/admin/login');
          return;
        }

        toast({
          variant: 'destructive',
          title: 'Erro ao carregar logs',
          description: axiosError.response?.data?.error || 'Tente novamente'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    window.open(`${API_URL}/api/internal/logs/export?type=audit`, '_blank');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs</h1>
          <p className="text-muted-foreground">Auditoria e eventos do sistema</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <div className="flex gap-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={(log as { id: string }).id}>
                    <TableCell>{new Date((log as { created_at: string }).created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{(log as { user_email: string }).user_email}</p>
                        <p className="text-xs text-muted-foreground">{(log as { user_role: string }).user_role}</p>
                      </div>
                    </TableCell>
                    <TableCell>{(log as { action: string }).action}</TableCell>
                    <TableCell>{(log as { resource_type: string }).resource_type}</TableCell>
                    <TableCell>{(log as { ip_address?: string }).ip_address || '-'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLog(log)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="p-4">
            <p className="text-muted-foreground">Logs de sistema carregam aqui</p>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card className="p-4">
            <p className="text-muted-foreground">Logs de erros carregam aqui</p>
          </Card>
        </TabsContent>
      </Tabs>

      <DetailModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detalhes do Log"
        data={selectedLog}
      />
    </div>
  );
}
