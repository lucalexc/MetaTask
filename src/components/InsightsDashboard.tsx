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
  const { data: tasks, isLoading: isLoadingTasks, refetch: refetchTasks } = useQuery({
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
          category_id
        `)
        .eq('user_id', user?.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch Categories
  const { data: categories, isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Refetch on mount to ensure fresh data
  React.useEffect(() => {
    if (user) {
      refetchTasks();
      refetchCategories();
    }
  }, [user, refetchTasks, refetchCategories]);

  const insightsData = useMemo(() => {
    if (!tasks || !categories) return null;

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalFocusSeconds = tasks.reduce((acc, t) => acc + (t.elapsed_time || 0), 0);
    const totalFocusHours = Math.floor(totalFocusSeconds / 3600);
    const totalFocusMinutes = Math.floor((totalFocusSeconds % 3600) / 60);

    // Tag Distribution
    const categoryCounts: Record<string, number> = {};
    (completedTasks || []).forEach(t => {
      const category = (categories || []).find(c => c.id === t?.category_id);
      const categoryName = category?.name ?? 'Sem Categoria';
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });

    const tagDistribution = Object.entries(categoryCounts)
      .map(([name, value], index) => ({
        name,
        value,
        color: (categories || []).find(c => c.name === name)?.color ?? COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Weekly Trend
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    const weeklyTrend = days.map(day => {
      const dayTasks = tasks.filter(t => isSameDay(new Date(t.created_at), day));
      const dayCompletedTasks = dayTasks.filter(t => t.status === 'completed');
      const dayFocusSeconds = dayTasks.reduce((acc, t) => acc + (t.elapsed_time || 0), 0);
      
      return {
        day: format(day, 'EEE', { locale: ptBR }),
        fullDate: format(day, 'yyyy-MM-dd'),
        focusMinutes: Math.round(dayFocusSeconds / 60),
        tasksCompleted: dayCompletedTasks.length
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
  }, [tasks, categories, dateRange]);

  if (isLoadingTasks || isLoadingCategories) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
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
          </>
        )}

      </div>
    </div>
  );
}
