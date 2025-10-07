import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';

export default function Impersonate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const impersonationToken = searchParams.get('impersonation_token');

    if (!impersonationToken) {
      toast.error('Token de impersonation inválido');
      navigate('/admin/clients');
      return;
    }

    validateAndLogin(impersonationToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate]);

  const validateAndLogin = async (token: string) => {
    try {
      // Decode JWT to get user/org info
      // The token IS the auth token, already validated by backend
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(atob(tokenParts[1]));

      if (!payload.user || !payload.organization) {
        throw new Error('Invalid token payload');
      }

      // Store auth and impersonation context
      localStorage.setItem('auth_token', token);
      localStorage.setItem('impersonation_active', 'true');
      localStorage.setItem('impersonation_org', payload.organization.name);
      localStorage.setItem('impersonation_user', payload.user.full_name);
      localStorage.setItem('user', JSON.stringify(payload.user));
      localStorage.setItem('organization_id', payload.organization.id);

      toast.success(`Impersonando ${payload.organization.name} como ${payload.user.full_name}`);

      // Redirect to client dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('Impersonation validation error:', error);
      toast.error('Erro ao validar token de impersonation: ' + (error.message || 'Token inválido'));

      // Return to admin
      setTimeout(() => {
        navigate('/admin/clients');
      }, 2000);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-ocean-blue to-soft-teal">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-white">Validando Impersonation</h2>
          <p className="text-white/80 mt-2">Aguarde enquanto validamos o acesso...</p>
        </div>
      </div>
    </div>
  );
}
