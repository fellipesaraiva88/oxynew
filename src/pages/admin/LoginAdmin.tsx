import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Mail } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function LoginAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Digite email e senha',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/internal/auth/login`, {
        email,
        password,
      }, { withCredentials: true });

      const { token, user } = response.data;

      // Mantém compatibilidade, mas cookie httpOnly já guarda a sessão
      try {
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(user));
      } catch (e) {
        // ignore storage errors
      }

      toast({
        title: '✅ Login realizado',
        description: `Bem-vindo, ${user.name}!`,
      });

      // Redirecionar para dashboard admin
      navigate('/admin/clients');
    } catch (error: any) {
      console.error('Login error:', error);

      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: error.response?.data?.error || 'Credenciais inválidas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-blue to-ocean-dark p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-ocean-blue/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-ocean-blue" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
          <CardDescription>
            Painel interno para equipe Oxy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-gradient text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              <p>Senha padrão: <code className="bg-muted px-2 py-1 rounded">Oxy2025!</code></p>
              <p className="text-xs mt-1">Mude sua senha no primeiro acesso</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
