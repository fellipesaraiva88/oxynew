import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare } from 'lucide-react';

interface AIHeroCardProps {
  conversations: number;
  timeSaved: string;
  revenue: number;
  activityData: Array<{ hour: string; count: number }>;
}

export function AIHeroCard({ conversations, timeSaved, revenue, activityData }: AIHeroCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="glass-card border-2 border-ocean-blue/20 overflow-hidden">
      <div className="bg-gradient-to-br from-ocean-blue to-sunset-orange p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-3xl font-bold mb-2">HOJE A IA ECONOMIZOU:</h3>
            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold">{timeSaved}</span>
                <span className="text-white/80 text-lg">do seu tempo</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold">R$ {revenue.toFixed(2)}</span>
                <span className="text-white/80 text-lg">em vendas automáticas</span>
              </div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>

        {/* Mini Gráfico */}
        <div className="h-32 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData}>
              <XAxis 
                dataKey="hour" 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  border: 'none',
                  borderRadius: '8px',
                  color: '#1e3a8a'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#ffffff" 
                strokeWidth={3}
                dot={{ fill: '#ffffff', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <Button
          onClick={() => navigate('/conversas')}
          size="lg"
          className="w-full bg-white text-ocean-blue hover:bg-gray-50 font-bold"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Ver todas as {conversations} conversas
        </Button>
      </div>
    </Card>
  );
}
