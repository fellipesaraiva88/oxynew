import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const active = localStorage.getItem('impersonation_active') === 'true';
    const org = localStorage.getItem('impersonation_org') || '';
    const user = localStorage.getItem('impersonation_user') || '';

    setIsActive(active);
    setOrgName(org);
    setUserName(user);
  }, []);

  const handleEndImpersonation = () => {
    // Clear impersonation context
    localStorage.removeItem('impersonation_active');
    localStorage.removeItem('impersonation_org');
    localStorage.removeItem('impersonation_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization_id');

    toast.success('Impersonation finalizado');

    // Redirect back to admin
    navigate('/admin/clients');
  };

  if (!isActive) return null;

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <div>
          <p className="font-semibold text-sm">
            🔐 Modo Impersonation Ativo
          </p>
          <p className="text-xs">
            Você está acessando como <strong>{userName}</strong> de <strong>{orgName}</strong>
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleEndImpersonation}
        className="bg-yellow-600 text-white hover:bg-yellow-700 border-none"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair do Impersonation
      </Button>
    </div>
  );
}
