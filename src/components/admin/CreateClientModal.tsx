import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Mail, Phone, User, Key, CreditCard } from 'lucide-react';
import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api';
import axios from 'axios';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateClientModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    email: '',
    phone: '',
    fullName: '',
    password: '',
    subscriptionPlan: 'free' as 'free' | 'starter' | 'pro' | 'enterprise',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organizationName || !formData.email || !formData.fullName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await apiClient.post(
        '/api/internal/client-management/clients',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const generatedPassword = res.data.generatedPassword || formData.password;

      toast.success(
        <div>
          <p className="font-semibold">Cliente criado com sucesso!</p>
          <p className="text-sm mt-1">Senha gerada: <span className="font-mono font-bold">{generatedPassword}</span></p>
          <p className="text-xs text-muted-foreground mt-1">Copie esta senha antes de fechar</p>
        </div>,
        { duration: 10000 }
      );

      // Reset form
      setFormData({
        organizationName: '',
        email: '',
        phone: '',
        fullName: '',
        password: '',
        subscriptionPlan: 'free',
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      let errorMessage = "Tente novamente";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error('Erro ao criar cliente: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      organizationName: '',
      email: '',
      phone: '',
      fullName: '',
      password: '',
      subscriptionPlan: 'free',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Criar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova organização e usuário guardian
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Organização */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Dados da Organização
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">
                  Nome da Organização <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({ ...formData, organizationName: e.target.value })
                  }
                  placeholder="Patient Shop Exemplo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@exemplo.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">Plano de Assinatura</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Select
                    value={formData.subscriptionPlan}
                    onValueChange={(value: 'free' | 'starter' | 'pro' | 'enterprise') =>
                      setFormData({ ...formData, subscriptionPlan: value })
                    }
                  >
                    <SelectTrigger className="pl-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="starter">Starter - R$ 97/mês</SelectItem>
                      <SelectItem value="pro">Pro - R$ 297/mês</SelectItem>
                      <SelectItem value="enterprise">Enterprise - R$ 997/mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Usuário Guardian */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Usuário Guardian (Primeiro Acesso)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="João Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Senha (opcional)
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Deixe vazio para gerar automaticamente"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Se não informada, uma senha será gerada automaticamente
                </p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
