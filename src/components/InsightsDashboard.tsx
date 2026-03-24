import React, { useState, useMemo } from 'react';
import { BarChart2, Clock, CheckCircle, Calendar, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, Legend 
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const tasks = payload.find((p: any) => p.dataKey === 'tasksCompleted')?.value;
    const energy = payload.find((p: any) => p.dataKey === 'energyLevel')?.value;
    
    let energyLabel = 'Normal';
    if (energy >= 4) energyLabel = 'Alta';
    else if (energy <= 2) energyLabel = 'Baixa';

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-sm">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        <p className="text-gray-600">
          <span className="font-semibold text-blue-600">{tasks || 0}</span> tarefas concluídas
        </p>
        <p className="text-gray-600">
          Energia: <span className="font-semibold text-orange-500">{energy || 0}/5</span> ({energy ? energyLabel : 'Não registrada'})
        </p>
      </div>
    );
  }
  return null;
};

export default function InsightsDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const dateRange = useMemo(() => {
    const now = new Date();
    if (timeRange === 'week') {
      return { start: subDays(now, 6), end: now }; // Last 7 days
    } else {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [timeRange]);

  // Fetch Tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', user?.id, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, 
          status, 
          elapsed_time, 
          created_at, 
          updated_at,
          tag_id,
          task_tags ( id, name )
        `)
        .eq('user_id', user?.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch Daily Energy
  const { data: energyLogs, isLoading: isLoadingEnergy } = useQuery({
    queryKey: ['daily_energy', user?.id, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_energy')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch Today's Energy
  const { data: todayEnergy } = useQuery({
    queryKey: ['daily_energy_today', user?.id],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_energy')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .maybeSingle(); // FIX: Changed from .single() to .maybeSingle() to avoid 406 Not Acceptable error when no record is found
      
      if (error) throw error; // FIX: maybeSingle() returns null data instead of throwing PGRST116, so we can just throw real errors
      return data;
    },
    enabled: !!user,
  });

  const logEnergyMutation = useMutation({
    mutationFn: async (level: number) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_energy')
        .upsert({ 
          user_id: user?.id, 
          date: today, 
          level 
        }, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_energy'] });
      queryClient.invalidateQueries({ queryKey: ['daily_energy_today'] });
    }
  });

  const insightsData = useMemo(() => {
    if (!tasks || !energyLogs) return null;

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalFocusSeconds = tasks.reduce((acc, t) => acc + (t.elapsed_time || 0), 0);
    const totalFocusHours = Math.floor(totalFocusSeconds / 3600);
    const totalFocusMinutes = Math.floor((totalFocusSeconds % 3600) / 60);

    // Tag Distribution
    const tagCounts: Record<string, number> = {};
    completedTasks.forEach(t => {
      const tagName = (Array.isArray(t.task_tags) ? t.task_tags[0]?.name : (t.task_tags as any)?.name) || 'Sem Categoria';
      tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
    });

    const tagDistribution = Object.entries(tagCounts)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Weekly Trend & Productivity vs Energy
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    const weeklyTrend = days.map(day => {
      const dayTasks = tasks.filter(t => isSameDay(new Date(t.created_at), day));
      const dayCompletedTasks = dayTasks.filter(t => t.status === 'completed');
      const dayFocusSeconds = dayTasks.reduce((acc, t) => acc + (t.elapsed_time || 0), 0);
      
      const dayEnergy = energyLogs.find(e => e.date === format(day, 'yyyy-MM-dd'));

      return {
        day: format(day, 'EEE', { locale: ptBR }),
        fullDate: format(day, 'yyyy-MM-dd'),
        focusMinutes: Math.round(dayFocusSeconds / 60),
        tasksCompleted: dayCompletedTasks.length,
        energyLevel: dayEnergy?.level || 0
      };
    });

    // Best Day
    const bestDayData = [...weeklyTrend].sort((a, b) => b.tasksCompleted - a.tasksCompleted)[0];
    const bestDay = bestDayData?.tasksCompleted > 0 ? bestDayData.day : '-';

    // Streak (consecutive days with at least 1 completed task)
    let streak = 0;
    for (let i = weeklyTrend.length - 1; i >= 0; i--) {
      if (weeklyTrend[i].tasksCompleted > 0) {
        streak++;
      } else if (i < weeklyTrend.length - 1) { // Ignore today if not completed yet, but break if past day is 0
        break;
      }
    }

    return {
      kpis: {
        totalFocusTime: `${totalFocusHours}h ${totalFocusMinutes}m`,
        tasksCompleted: completedTasks.length,
        bestDay,
        streak: `${streak} dias`
      },
      tagDistribution,
      weeklyTrend
    };
  }, [tasks, energyLogs, dateRange]);

  if (isLoadingTasks || isLoadingEnergy) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Energy Banner */}
        <Card className="border-none shadow-sm bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Como está sua energia hoje?
              </h3>
              <p className="text-orange-700 text-sm mt-1">Registre seu nível de energia para correlacionar com sua produtividade.</p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => logEnergyMutation.mutate(level)}
                  disabled={logEnergyMutation.isPending}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                    todayEnergy?.level === level 
                      ? 'bg-orange-500 text-white shadow-md scale-110' 
                      : 'bg-white text-gray-400 hover:bg-orange-100 hover:text-orange-600 hover:scale-105'
                  }`}
                >
                  {level === 1 && '🥱'}
                  {level === 2 && '😪'}
                  {level === 3 && '😐'}
                  {level === 4 && '🙂'}
                  {level === 5 && '🤩'}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-blue-600" />
              Meus Insights
            </h1>
            <p className="text-gray-500 mt-1">Acompanhe seu ritmo, foco e energia</p>
          </div>
          
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month')}
            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
          >
            <option value="week">Últimos 7 dias</option>
            <option value="month">Este Mês</option>
          </select>
        </div>

        {insightsData && (
          <>
            {/* Row 1: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tempo de Foco Total</p>
                    <h3 className="text-2xl font-bold text-gray-900">{insightsData.kpis.totalFocusTime}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tarefas Concluídas</p>
                    <h3 className="text-2xl font-bold text-gray-900">{insightsData.kpis.tasksCompleted}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dia Mais Produtivo</p>
                    <h3 className="text-2xl font-bold text-gray-900 capitalize">{insightsData.kpis.bestDay}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ofensiva Atual</p>
                    <h3 className="text-2xl font-bold text-gray-900">{insightsData.kpis.streak}</h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: 50/50 Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tag Distribution */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-800">Onde invisto meu tempo?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex flex-col items-center">
                    {insightsData.tagDistribution.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={insightsData.tagDistribution}
                              cx="50%"
                              cy="45%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {insightsData.tagDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`${value} tarefas`, 'Concluídas']}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Custom Legend */}
                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                          {insightsData.tagDistribution.map((tag) => (
                            <div key={tag.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                              <span className="text-sm text-gray-600 font-medium">{tag.name}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        Nenhuma tarefa concluída no período.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Focus Time */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-800">Ritmo Diário (Minutos Focados)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insightsData.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: '#f3f4f6' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="focusMinutes" name="Minutos" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Full Width Composed Chart */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800">Mapa de Produtividade vs Energia</CardTitle>
                <p className="text-sm text-gray-500">Relação entre tarefas concluídas e seu nível de energia no dia.</p>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={insightsData.weeklyTrend} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 5]} hide />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar 
                        yAxisId="left" 
                        dataKey="tasksCompleted" 
                        name="Tarefas Concluídas" 
                        fill="#bfdbfe" // blue-200
                        radius={[4, 4, 0, 0]} 
                        barSize={40} 
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="energyLevel" 
                        name="Nível de Energia (1-5)" 
                        stroke="#f97316" // orange-500
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 6 }} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}
