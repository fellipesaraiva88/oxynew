import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import {
  Loader2,
  UserPlus,
  Building2,
  Brain,
  Phone,
  Package,
  Shield,
  Users,
  Settings as SettingsIcon,
  Sparkles,
  Clock,
  Zap,
  ChevronRight,
  Edit,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
}

interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  subscription_plan: string;
  subscription_status: string;
  quota_messages_monthly: number;
  quota_instances: number;
}

interface OrganizationSettings {
  id: string;
  ai_client_enabled: boolean;
  ai_client_model: string;
  ai_client_temperature: number;
  aurora_enabled: boolean;
  aurora_model: string;
  aurora_daily_summary_time: string;
  business_hours: Record<string, unknown>;
}

interface OwnerNumber {
  id: string;
  phone_number: string;
  owner_name: string;
  is_active: boolean;
  notes?: string;
}

interface Service {
  id: string;
  name: string;
  type: string;
  price_cents: number;
  duration_minutes: number;
  is_active: boolean;
}

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [team, setTeam] = useState<InternalUser[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [ownerNumbers, setOwnerNumbers] = useState<OwnerNumber[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'viewer',
    password: ''
  });

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch internal users via Admin API
      try {
        const token = localStorage.getItem('admin_token');
        const resp = await axios.get(`${API_URL}/api/internal/settings/team`, { withCredentials: true });
        setTeam(resp.data.team || []);
      } catch (e: any) {
        if (e.response?.status === 401) {
          navigate('/admin/login');
          return;
        }
        throw e;
      }

      // Fetch organization via Admin API
      const orgResp = await axios.get(`${API_URL}/api/internal/settings/organization`, { withCredentials: true });
      const org = orgResp.data.organization;
      if (org) setOrganization(org);

      // Fetch organization settings via Admin API
      if (org?.id) {
        const settingsResp = await axios.get(`${API_URL}/api/internal/settings/organization/${org.id}/settings`, { withCredentials: true });
        if (settingsResp.data?.settings) setSettings(settingsResp.data.settings);

        // Owners
        const ownersResp = await axios.get(`${API_URL}/api/internal/settings/organization/${org.id}/owners`, { withCredentials: true });
        setOwnerNumbers(ownersResp.data?.owners || []);

        // Services
        const servicesResp = await axios.get(`${API_URL}/api/internal/settings/organization/${org.id}/services`, { withCredentials: true });
        setServices(servicesResp.data?.services || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Tente novamente mais tarde'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, navigate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.patch(
        `${API_URL}/api/internal/settings/team/${userId}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Status atualizado',
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`
      });

      fetchAllData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Tente novamente'
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!settings || !organization) return;

    try {
      await axios.patch(
        `${API_URL}/api/internal/settings/organization/${organization.id}/settings`,
        {
          ai_client_enabled: settings.ai_client_enabled,
          aurora_enabled: settings.aurora_enabled,
          ai_client_temperature: settings.ai_client_temperature,
          aurora_daily_summary_time: settings.aurora_daily_summary_time,
        },
        { withCredentials: true }
      );

      toast({
        title: 'Configurações salvas',
        description: 'As alterações foram aplicadas com sucesso'
      });

      setEditingSettings(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Tente novamente'
      });
    }
  };

  const handleCreateUser = async () => {
    try {
      await axios.post(
        `${API_URL}/api/internal/settings/team`,
        {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          password: newUser.password,
        },
        { withCredentials: true }
      );

      toast({ title: 'Usuário criado', description: 'Novo membro adicionado à equipe' });
      setNewUser({ name: '', email: '', role: 'viewer', password: '' });
      fetchAllData();
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/admin/login');
        return;
      }
      toast({ variant: 'destructive', title: 'Erro ao criar usuário', description: 'Tente novamente' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Configurações
              </h1>
              <p className="text-gray-600">Gerencie sua organização e equipe</p>
            </div>
          </div>
        </motion.div>

        {/* Organization Overview - Compact */}
        {organization && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{organization.name}</h3>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs">
                    {organization.subscription_status === 'active' ? 'Ativo' : organization.subscription_status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                    <p className="text-xs opacity-90">Plano</p>
                    <p className="text-sm font-bold capitalize">{organization.subscription_plan}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">Mensagens/mês</p>
                    <p className="text-sm font-bold text-gray-900">
                      {organization.quota_messages_monthly.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">Instâncias</p>
                    <p className="text-sm font-bold text-gray-900">{organization.quota_instances}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">Equipe Ativa</p>
                    <p className="text-sm font-bold text-gray-900">
                      {team.filter((m: { is_active: boolean }) => m.is_active).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-white shadow-lg p-1 rounded-xl">
            <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Equipe
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Brain className="w-4 h-4 mr-2" />
              IA & OxyAssistant
            </TabsTrigger>
            <TabsTrigger value="owners" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Donos
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />
              Serviços
            </TabsTrigger>
          </TabsList>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Membro da Equipe</DialogTitle>
                    <DialogDescription>
                      Adicione um novo usuário interno à equipe Oxy
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Senha</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                      <Button onClick={handleCreateUser} className="w-full">Criar Usuário</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {team.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <Badge
                            variant={member.is_active ? 'default' : 'secondary'}
                            className={member.is_active ? 'bg-green-500 text-white' : ''}
                          >
                            {member.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{member.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{member.email}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                        {member.last_login_at && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                            <Clock className="w-3 h-3" />
                            Último login: {new Date(member.last_login_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full group-hover:bg-gray-50"
                          onClick={() => handleToggleUserActive(member.id, member.is_active)}
                        >
                          {member.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* AI Settings Tab */}
          <TabsContent value="ai" className="space-y-6">
            {settings && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        <div>
                          <CardTitle>Configurações de IA</CardTitle>
                          <CardDescription>Gerencie os assistentes inteligentes</CardDescription>
                        </div>
                      </div>
                      {!editingSettings ? (
                        <Button
                          variant="outline"
                          onClick={() => setEditingSettings(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingSettings(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSaveSettings}
                            className="bg-gradient-to-r from-blue-500 to-purple-600"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Patient AI */}
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Brain className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">Agente Cliente</h3>
                        </div>
                        <Switch
                          checked={settings.ai_client_enabled}
                          onCheckedChange={(checked) =>
                            editingSettings && setSettings({ ...settings, ai_client_enabled: checked })
                          }
                          disabled={!editingSettings}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Modelo</Label>
                          <p className="font-semibold text-gray-900">{settings.ai_client_model}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Temperatura</Label>
                          {editingSettings ? (
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="2"
                              value={settings.ai_client_temperature}
                              onChange={(e) => setSettings({
                                ...settings,
                                ai_client_temperature: parseFloat(e.target.value)
                              })}
                            />
                          ) : (
                            <p className="font-semibold text-gray-900">{settings.ai_client_temperature}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* OxyAssistant */}
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          <h3 className="font-semibold text-gray-900">OxyAssistant</h3>
                        </div>
                        <Switch
                          checked={settings.aurora_enabled}
                          onCheckedChange={(checked) =>
                            editingSettings && setSettings({ ...settings, aurora_enabled: checked })
                          }
                          disabled={!editingSettings}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Modelo</Label>
                          <p className="font-semibold text-gray-900">{settings.aurora_model}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Horário do Resumo Diário</Label>
                          {editingSettings ? (
                            <Input
                              type="time"
                              value={settings.aurora_daily_summary_time}
                              onChange={(e) => setSettings({
                                ...settings,
                                aurora_daily_summary_time: e.target.value
                              })}
                            />
                          ) : (
                            <p className="font-semibold text-gray-900">{settings.aurora_daily_summary_time}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Guardian Numbers Tab */}
          <TabsContent value="owners" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownerNumbers.map((guardian, index) => (
                <motion.div
                  key={guardian.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                          <Phone className="w-6 h-6 text-white" />
                        </div>
                        <Badge variant={guardian.is_active ? 'default' : 'secondary'}>
                          {guardian.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{guardian.owner_name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{guardian.phone_number}</p>
                      {guardian.notes && (
                        <p className="text-xs text-gray-500 italic">{guardian.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant="outline" className="capitalize">
                          {service.type}
                        </Badge>
                        <Badge variant={service.is_active ? 'default' : 'secondary'}>
                          {service.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-3">{service.name}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Duração</span>
                          <span className="font-semibold text-gray-900">{service.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Preço</span>
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            R$ {(service.price_cents / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
