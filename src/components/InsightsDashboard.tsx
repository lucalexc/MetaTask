import React, { useState } from 'react';
import { BarChart2, Clock, CheckCircle, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, Legend 
} from 'recharts';

const mockInsights = {
  kpis: { 
    totalFocusTime: '42h 15m', 
    tasksCompleted: 128, 
    bestDay: 'Terça-feira', 
    streak: '5 dias' 
  },
  weeklyTrend: [
    { day: 'Seg', focusMinutes: 120, energyLevel: 3, tasksCompleted: 15 },
    { day: 'Ter', focusMinutes: 240, energyLevel: 4, tasksCompleted: 22 },
    { day: 'Qua', focusMinutes: 180, energyLevel: 3, tasksCompleted: 18 },
    { day: 'Qui', focusMinutes: 300, energyLevel: 5, tasksCompleted: 28 },
    { day: 'Sex', focusMinutes: 150, energyLevel: 2, tasksCompleted: 12 },
    { day: 'Sáb', focusMinutes: 60, energyLevel: 4, tasksCompleted: 5 },
    { day: 'Dom', focusMinutes: 0, energyLevel: 5, tasksCompleted: 0 },
  ],
  tagDistribution: [
    { name: 'Trabalho', value: 45, color: '#3b82f6' }, // blue-500
    { name: 'Estudos', value: 25, color: '#8b5cf6' }, // violet-500
    { name: 'Saúde', value: 15, color: '#10b981' }, // emerald-500
    { name: 'Lazer', value: 15, color: '#f59e0b' }, // amber-500
  ]
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const tasks = payload.find((p: any) => p.dataKey === 'tasksCompleted')?.value;
    const energy = payload.find((p: any) => p.dataKey === 'energyLevel')?.value;
    
    let energyLabel = 'Normal';
    if (energy >= 4) energyLabel = 'Alta';
    else if (energy <= 2) energyLabel = 'Baixa';

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        <p className="text-slate-600">
          <span className="font-semibold text-blue-600">{tasks}</span> tarefas concluídas
        </p>
        <p className="text-slate-600">
          Energia: <span className="font-semibold text-orange-500">{energy}/5</span> ({energyLabel})
        </p>
      </div>
    );
  }
  return null;
};

export default function InsightsDashboard() {
  const [timeRange, setTimeRange] = useState('week');

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-blue-600" />
              Meus Insights
            </h1>
            <p className="text-slate-500 mt-1">Acompanhe seu ritmo, foco e energia</p>
          </div>
          
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>
        </div>

        {/* Row 1: KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tempo de Foco Total</p>
                <h3 className="text-2xl font-bold text-slate-900">{mockInsights.kpis.totalFocusTime}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tarefas Concluídas</p>
                <h3 className="text-2xl font-bold text-slate-900">{mockInsights.kpis.tasksCompleted}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Dia Mais Produtivo</p>
                <h3 className="text-2xl font-bold text-slate-900">{mockInsights.kpis.bestDay}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Ofensiva Atual</p>
                <h3 className="text-2xl font-bold text-slate-900">{mockInsights.kpis.streak}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: 50/50 Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tag Distribution */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">Onde invisto meu tempo?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockInsights.tagDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {mockInsights.tagDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'Tempo']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Custom Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {mockInsights.tagDistribution.map((tag) => (
                    <div key={tag.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm text-slate-600 font-medium">{tag.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Focus Time */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">Ritmo Diário (Minutos Focados)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockInsights.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="focusMinutes" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Full Width Composed Chart */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Mapa de Produtividade vs Energia</CardTitle>
            <p className="text-sm text-slate-500">Relação entre tarefas concluídas e seu nível de energia no dia.</p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockInsights.weeklyTrend} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
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

      </div>
    </div>
  );
}
