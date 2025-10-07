import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Offline() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Card className="max-w-md w-full border-2 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <WifiOff className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Você está offline</CardTitle>
            <CardDescription className="text-base">
              Não foi possível conectar ao Oxy. Verifique sua conexão com a internet.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Enquanto isso:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Verifique se o Wi-Fi está conectado</li>
              <li>Tente alternar para dados móveis</li>
              <li>Reinicie seu roteador se necessário</li>
            </ul>
          </div>
          <Button 
            onClick={handleRetry} 
            className="w-full"
            size="lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
