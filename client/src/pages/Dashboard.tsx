import { useEffect, useState, memo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentTrack, useTodayProgress, useToggleProgress } from "@/hooks/use-tracks";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/Button";
import { format } from "date-fns";
import { Check, Lock, Loader2, Trophy, Flame, Zap, Moon, Sun, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const ConfettiEffect = memo(({ completionPercentage }: { completionPercentage: number }) => {
  useEffect(() => {
    if (completionPercentage === 100) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#6366f1', '#10b981']
      });
    }
  }, [completionPercentage]);
  return null;
});

// Motivational quotes based on progress
const getMotivationalQuote = (percentage: number, remaining: number) => {
  if (percentage === 100) return "Você dominou o dia! Excelente trabalho.";
  if (percentage >= 75) return `Quase lá! Só mais ${remaining} tarefa(s).`;
  if (percentage >= 50) return "Metade do caminho! Continue firme.";
  return "O segredo do sucesso é começar. Vamos lá!";
};

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: track, isLoading: isTrackLoading } = useCurrentTrack();
  const { data: progress, isLoading: isProgressLoading } = useTodayProgress();
  const toggleProgress = useToggleProgress();
  const [_, setLocation] = useLocation();

  // Redirect if no assessment
  useEffect(() => {
    if (user && !user.lastAssessmentDate) {
      setLocation("/assessment");
    }
  }, [user, setLocation]);

  const handleToggle = async (taskId: number) => {
    try {
      await toggleProgress.mutateAsync({ taskId, date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Failed to toggle task", error);
    }
  };

  if (isAuthLoading || isTrackLoading || isProgressLoading || !user || !track) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate completion
  const allTasks = track.pillars.flatMap((p: any) => p.tasks);
  const completedTaskIds = progress?.map((p: any) => p.taskId) || [];
  const completedCount = completedTaskIds.length;
  const totalCount = allTasks.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const remainingTasks = totalCount - completedCount;

  // Calculate day of year (out of 365)
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const daysLeft = 365 - dayOfYear;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <ConfettiEffect completionPercentage={completionPercentage} />

      {/* Header Section */}
      <div className="pt-8 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
              Bom dia, <span className="text-blue-600">{user.name.split(" ")[0]}</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium">
              <Trophy className="w-4 h-4 text-blue-600" />
              <span>Nível {track.level}: {track.title}</span>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end">
            <div className="premium-card px-5 py-3 flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold font-mono text-slate-900">{daysLeft}</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Dias Restantes</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Sun className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Progress Card - Redesigned */}
        <div className="premium-card p-6 md:p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Progresso Diário</h2>
                <p className="text-slate-500 text-sm font-medium">
                  {getMotivationalQuote(completionPercentage, remainingTasks)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold text-blue-600 tracking-tight">{Math.round(completionPercentage)}%</span>
              </div>
            </div>

            {/* Thicker, Gradient Progress Bar */}
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <div className="mt-4 flex justify-between items-center text-sm text-slate-400 font-medium">
              <span>0%</span>
              <span>{completedCount} de {totalCount} concluídos</span>
              <span>100%</span>
            </div>
          </div>

          {/* Subtle Texture/Decoration */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      {/* Main Content - Grid Layout */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          Agenda de Hoje
          <span className="text-sm font-normal text-slate-500 ml-2 bg-white px-2 py-0.5 rounded-full border border-slate-100">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {track.pillars.map((pillar: any) => (
            <div key={pillar.id} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                {pillar.category}
              </h3>

              <div className="space-y-3">
                {pillar.tasks.map((task: any) => {
                  const isCompleted = completedTaskIds.includes(task.id);
                  let Icon = Zap;
                  if (task.title.toLowerCase().includes("sono")) Icon = Moon;
                  if (task.title.toLowerCase().includes("treino")) Icon = Flame;
                  if (task.isHabit) Icon = Flame;

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={false}
                      className="relative group outline-none"
                    >
                      <button
                        onClick={() => handleToggle(task.id)}
                        className={cn(
                          "w-full text-left premium-card p-4 flex items-start gap-4 transition-all duration-200 outline-none ring-offset-2 focus-visible:ring-2 ring-blue-500",
                          isCompleted
                            ? "bg-slate-50/50 border-transparent shadow-none"
                            : "hover:-translate-y-1 hover:shadow-lg bg-white"
                        )}
                      >
                        {/* Custom Checkbox */}
                        <div className={cn(
                          "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
                          isCompleted
                            ? "bg-gradient-to-tr from-blue-500 to-indigo-600 border-transparent text-white scale-100"
                            : "border-slate-200 group-hover:border-blue-400 bg-white"
                        )}>
                          {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-semibold text-base transition-all truncate pr-2",
                            isCompleted ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800"
                          )}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {task.frequencyPerWeek}x / semana
                            </span>
                            {task.isHabit && (
                              <span className="text-[11px] font-medium flex items-center text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                                <Flame className="w-3 h-3 mr-1" /> Hábito
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Indicator Icon */}
                        {!isCompleted && (
                          <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Banner (if not premium) */}
      {!user.isPremium && (
        <div className="mt-16 mb-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/20">
                  Premium
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-3">Desbloqueie Níveis 2-4</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Leve seu design de vida para o próximo nível. Acesse trilhas avançadas, análises detalhadas e recursos exclusivos da comunidade.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-white text-slate-900 hover:bg-white/90 border-none h-14 px-8 rounded-full text-base font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                onClick={() => window.location.href = "https://buy.stripe.com/7sY3cueLgguW1Cj7xA1Jm00"}
              >
                Fazer Upgrade <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
