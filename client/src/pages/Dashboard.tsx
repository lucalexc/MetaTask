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
            <h1 className="text-[26px] leading-[35px] font-bold text-[#202020] mb-2 tracking-tight">
              Bom dia, <span>{user.name.split(" ")[0]}</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 border border-gray-200 text-[#202020] text-[13px] leading-[18px] font-normal">
              <Trophy className="w-4 h-4 text-[#808080]" />
              <span>Nível {track.level}: {track.title}</span>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 flex items-center gap-4">
              <div className="text-right">
                <p className="text-[26px] leading-[35px] font-bold text-[#202020]">{daysLeft}</p>
                <p className="text-[13px] leading-[18px] text-[#808080] font-normal uppercase">Dias Restantes</p>
              </div>
              <div className="text-[#808080]">
                <Sun className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Progress Card - Redesigned */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-[14px] leading-[22px] font-bold text-[#202020] mb-1">Progresso Diário</h2>
                <p className="text-[#808080] text-[13px] leading-[18px] font-normal">
                  {getMotivationalQuote(completionPercentage, remainingTasks)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[26px] leading-[35px] font-bold text-[#202020]">{Math.round(completionPercentage)}%</span>
              </div>
            </div>

            {/* Thicker, Gradient Progress Bar */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1f60c2] transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <div className="mt-4 flex justify-between items-center text-[13px] leading-[18px] text-[#808080] font-normal">
              <span>0%</span>
              <span>{completedCount} de {totalCount} concluídos</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Grid Layout */}
      <div>
        <h2 className="text-[26px] leading-[35px] font-bold text-[#202020] mb-6 flex items-center gap-2">
          Agenda de Hoje
          <span className="text-[13px] leading-[18px] font-normal text-[#808080] ml-2">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {track.pillars.map((pillar: any) => (
            <div key={pillar.id} className="space-y-4">
              <h3 className="text-[14px] leading-[22px] font-bold text-[#202020] flex items-center gap-2">
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
                          "w-full text-left bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3 transition-all duration-200 ease-out outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] group hover:bg-gray-50 shadow-sm",
                          isCompleted && "bg-gray-50 opacity-70"
                        )}
                      >
                        {/* Custom Checkbox */}
                        <div className={cn(
                          "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ease-out shrink-0",
                          isCompleted
                            ? "bg-[#1f60c2] border-[#1f60c2] text-white"
                            : "border-gray-300 group-hover:border-[#1f60c2] bg-white"
                        )}>
                          {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-[13px] leading-[18px] font-normal transition-all truncate pr-2",
                            isCompleted ? "text-[#808080] line-through" : "text-[#202020]"
                          )}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[12px] font-normal text-[#808080]">
                              {task.frequencyPerWeek}x / semana
                            </span>
                            {task.isHabit && (
                              <span className="text-[12px] font-normal flex items-center text-[#808080]">
                                <Flame className="w-3 h-3 mr-1" /> Hábito
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Indicator Icon */}
                        {!isCompleted && (
                          <div className="text-[#808080] group-hover:text-[#202020] transition-colors">
                            <Icon className="w-4 h-4" />
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
          <div className="bg-white border border-gray-200 rounded-xl p-8 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-block px-3 py-1 rounded-md bg-gray-100 text-[#202020] text-[12px] font-bold uppercase tracking-wider mb-4 border border-gray-200">
                Premium
              </div>
              <h3 className="text-[26px] leading-[35px] font-bold mb-3 text-[#202020]">Desbloqueie Níveis 2-4</h3>
              <p className="text-[#808080] text-[13px] leading-[18px] font-normal">
                Leve seu design de vida para o próximo nível. Acesse trilhas avançadas, análises detalhadas e recursos exclusivos da comunidade.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-[#1f60c2] text-white hover:bg-[#1a51a3] border-none px-8 rounded-lg text-[13px] leading-[18px] font-bold shadow-sm transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2]"
              onClick={() => window.location.href = "https://buy.stripe.com/7sY3cueLgguW1Cj7xA1Jm00"}
            >
              Fazer Upgrade <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
