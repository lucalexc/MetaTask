import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Lock, Star, Sword, Shield, Crown, Zap, X, 
  Book, User, Home, Target, Mountain, Moon, Repeat, 
  Droplets, Calendar, Dumbbell, Apple, Flame, Sparkles,
  Wrench, GraduationCap, Cpu, TrendingUp, Rocket,
  Heart, ShieldCheck, Compass, Cross, HandHeart, Flag
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

type PhaseStatus = 'completed' | 'active' | 'locked';
type Act = 1 | 2 | 3 | 4;

interface Mission {
  id: string;
  title: string;
  completed: boolean;
}

interface Phase {
  id: string;
  title: string;
  description: string;
  status: PhaseStatus;
  icon: React.ElementType;
  unlocksInDays?: number;
  missions: Mission[];
  progress: number;
  act: Act;
}

const MOCK_PHASES: Phase[] = [
  // Ato 1: O Despertar
  {
    id: 'p1', title: 'Necrológio', act: 1, status: 'active', icon: Book, progress: 0,
    description: 'Descobrindo o seu propósito através da reflexão sobre o seu legado final.',
    missions: [{ id: 'm1-1', title: 'Escrever seu próprio necrológio', completed: false }, { id: 'm1-2', title: 'Definir 3 valores inegociáveis', completed: false }]
  },
  {
    id: 'p2', title: 'Temperamento', act: 1, status: 'locked', icon: User, unlocksInDays: 7, progress: 0,
    description: 'Entenda sua natureza biológica para dominar suas reações e inclinações.',
    missions: [{ id: 'm2-1', title: 'Identificar seu temperamento dominante', completed: false }]
  },
  {
    id: 'p3', title: 'Ambiente', act: 1, status: 'locked', icon: Home, unlocksInDays: 14, progress: 0,
    description: 'Mude o ambiente ao seu redor para que ele trabalhe a seu favor, não contra.',
    missions: [{ id: 'm3-1', title: 'Organizar seu local de trabalho', completed: false }]
  },
  // Ato 2: A Forja
  {
    id: 'p4', title: 'Foco Treinável', act: 2, status: 'locked', icon: Target, unlocksInDays: 21, progress: 0,
    description: 'O foco é um músculo. Aprenda a direcionar sua atenção com intenção.',
    missions: [{ id: 'm4-1', title: '20 min de foco total sem distrações', completed: false }]
  },
  {
    id: 'p5', title: 'Desconforto', act: 2, status: 'locked', icon: Mountain, unlocksInDays: 28, progress: 0,
    description: 'Lidando com o desconforto voluntário para fortalecer a vontade.',
    missions: [{ id: 'm5-1', title: 'Banho frio ou jejum matinal', completed: false }]
  },
  {
    id: 'p6', title: 'Sono de Qualidade', act: 2, status: 'locked', icon: Moon, unlocksInDays: 35, progress: 0,
    description: 'O descanso é a base da performance. Domine sua higiene do sono.',
    missions: [{ id: 'm6-1', title: 'Sem telas 1h antes de dormir', completed: false }]
  },
  {
    id: 'p7', title: 'Constância', act: 2, status: 'locked', icon: Repeat, unlocksInDays: 42, progress: 0,
    description: 'Dominando a arte de aparecer todos os dias, independente da motivação.',
    missions: [{ id: 'm7-1', title: 'Cumprir a rotina por 3 dias seguidos', completed: false }]
  },
  {
    id: 'p8', title: 'Hidratação', act: 2, status: 'locked', icon: Droplets, unlocksInDays: 49, progress: 0,
    description: 'Repondo água. Seu cérebro e músculos dependem de hidratação constante.',
    missions: [{ id: 'm8-1', title: 'Beber 3L de água no dia', completed: false }]
  },
  {
    id: 'p9', title: 'Organização', act: 2, status: 'locked', icon: Calendar, unlocksInDays: 56, progress: 0,
    description: 'Organizando minha rotina para eliminar a fadiga de decisão.',
    missions: [{ id: 'm9-1', title: 'Listar tarefas da semana no domingo', completed: false }]
  },
  {
    id: 'p10', title: 'Esportes', act: 2, status: 'locked', icon: Dumbbell, unlocksInDays: 63, progress: 0,
    description: 'O corpo foi feito para o movimento. Pratique esportes com intensidade.',
    missions: [{ id: 'm10-1', title: 'Treino de força ou cardio intenso', completed: false }]
  },
  {
    id: 'p11', title: 'Alimentação', act: 2, status: 'locked', icon: Apple, unlocksInDays: 70, progress: 0,
    description: 'Se alimentando como um humano, não como um processador de lixo.',
    missions: [{ id: 'm11-1', title: 'Zero açúcar e zero processados por 24h', completed: false }]
  },
  {
    id: 'p12', title: 'Vícios', act: 2, status: 'locked', icon: Flame, unlocksInDays: 77, progress: 0,
    description: 'Se curando dos vícios que drenam sua dopamina e energia vital.',
    missions: [{ id: 'm12-1', title: 'Identificar e cortar um gatilho de vício', completed: false }]
  },
  {
    id: 'p13', title: 'Estética', act: 2, status: 'locked', icon: Sparkles, unlocksInDays: 84, progress: 0,
    description: 'Ficando menos feio. A auto-imagem reflete o respeito que você tem por si.',
    missions: [{ id: 'm13-1', title: 'Cuidar da aparência e postura', completed: false }]
  },
  // Ato 3: O Império
  {
    id: 'p14', title: 'Utilidade', act: 3, status: 'locked', icon: Wrench, unlocksInDays: 91, progress: 0,
    description: 'Buscando ser mais útil. Aprendendo habilidades que o mercado valoriza.',
    missions: [{ id: 'm14-1', title: 'Estudar uma nova ferramenta técnica', completed: false }]
  },
  {
    id: 'p15', title: 'Estudo', act: 3, status: 'locked', icon: GraduationCap, unlocksInDays: 98, progress: 0,
    description: 'O aprendizado contínuo é a única vantagem competitiva sustentável.',
    missions: [{ id: 'm15-1', title: 'Ler 30 páginas de um livro técnico', completed: false }]
  },
  {
    id: 'p16', title: 'Máquina', act: 3, status: 'locked', icon: Cpu, unlocksInDays: 105, progress: 0,
    description: 'Trabalhando como uma máquina. Execução implacável e eficiente.',
    missions: [{ id: 'm16-1', title: 'Completar 3 blocos de Deep Work', completed: false }]
  },
  {
    id: 'p17', title: 'Investimento', act: 3, status: 'locked', icon: TrendingUp, unlocksInDays: 112, progress: 0,
    description: 'Fazendo o dinheiro trabalhar. Construindo sua base de capital.',
    missions: [{ id: 'm17-1', title: 'Aportar qualquer valor em ativos', completed: false }]
  },
  {
    id: 'p18', title: 'Empreender', act: 3, status: 'locked', icon: Rocket, unlocksInDays: 119, progress: 0,
    description: 'Criando valor para o mundo através de soluções e negócios.',
    missions: [{ id: 'm18-1', title: 'Validar uma ideia de projeto/negócio', completed: false }]
  },
  // Ato 4: O Legado
  {
    id: 'p19', title: 'Relacionamento', act: 4, status: 'locked', icon: Heart, unlocksInDays: 126, progress: 0,
    description: 'Nenhum sucesso compensa o fracasso no lar. Cultive seus laços.',
    missions: [{ id: 'm19-1', title: 'Ato de serviço para alguém próximo', completed: false }]
  },
  {
    id: 'p20', title: 'Segurança', act: 4, status: 'locked', icon: ShieldCheck, unlocksInDays: 133, progress: 0,
    description: 'Segurança para a sua família. Protegendo quem você ama.',
    missions: [{ id: 'm20-1', title: 'Revisar seguros e reserva de emergência', completed: false }]
  },
  {
    id: 'p21', title: 'Verdade', act: 4, status: 'locked', icon: Compass, unlocksInDays: 140, progress: 0,
    description: 'Busca pela verdade. Alinhando sua vida com princípios eternos.',
    missions: [{ id: 'm21-1', title: 'Meditação sobre um princípio moral', completed: false }]
  },
  {
    id: 'p22', title: 'Fé Prática', act: 4, status: 'locked', icon: Cross, unlocksInDays: 147, progress: 0,
    description: 'Ações de um cristão. Vivendo a fé através das obras diárias.',
    missions: [{ id: 'm22-1', title: 'Praticar o perdão ou paciência heróica', completed: false }]
  },
  {
    id: 'p23', title: 'Caridade', act: 4, status: 'locked', icon: HandHeart, unlocksInDays: 154, progress: 0,
    description: 'Dar de si sem esperar nada em troca. A verdadeira riqueza.',
    missions: [{ id: 'm23-1', title: 'Doação de tempo ou recurso anonimamente', completed: false }]
  },
  {
    id: 'p24', title: 'O Legado', act: 4, status: 'locked', icon: Flag, unlocksInDays: 161, progress: 0,
    description: 'Deixando sua marca no mundo. O que restará quando você se for?',
    missions: [{ id: 'm24-1', title: 'Iniciar um projeto de longo prazo', completed: false }]
  }
];

const ACT_CONFIG = {
  1: {
    name: 'O Despertar',
    color: 'slate',
    bg: 'bg-slate-600',
    text: 'text-slate-600',
    border: 'border-slate-200',
    gradient: 'from-slate-600 to-slate-800',
    glow: 'shadow-slate-500/20'
  },
  2: {
    name: 'A Forja',
    color: 'orange',
    bg: 'bg-orange-600',
    text: 'text-orange-600',
    border: 'border-orange-200',
    gradient: 'from-orange-500 to-amber-700',
    glow: 'shadow-orange-500/30'
  },
  3: {
    name: 'O Império',
    color: 'blue',
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-indigo-700',
    glow: 'shadow-blue-500/30'
  },
  4: {
    name: 'O Legado',
    color: 'amber',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-200',
    gradient: 'from-amber-400 to-yellow-600',
    glow: 'shadow-amber-500/40'
  }
};

const PhaseDetailsModal = ({ phase, isOpen, onClose }: { phase: Phase | null, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen || !phase) return null;
  const config = ACT_CONFIG[phase.act];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
        >
          {/* Header */}
          <div className={cn("p-6 text-white relative overflow-hidden bg-gradient-to-br", config.gradient)}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <phase.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Ato {phase.act}: {config.name}</span>
                <h2 className="text-2xl font-bold tracking-tight">{phase.title}</h2>
              </div>
            </div>
            <p className="text-white/80 text-sm leading-relaxed relative z-10">
              {phase.description}
            </p>
          </div>

          {/* Progress */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progresso da Fase</span>
              <span className={cn("text-sm font-bold", config.text)}>{phase.progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${phase.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full rounded-full", config.bg)}
              />
            </div>
          </div>

          {/* Missions Checklist */}
          <div className="p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Missões do Sistema</h3>
            <div className="space-y-3">
              {phase.missions.map((mission) => (
                <div 
                  key={mission.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-all",
                    mission.completed 
                      ? "bg-slate-50 border-slate-200" 
                      : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                    mission.completed 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-slate-300"
                  )}>
                    {mission.completed && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    mission.completed ? "text-slate-400 line-through" : "text-slate-700"
                  )}>
                    {mission.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button 
              onClick={onClose}
              className={cn("px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors", config.bg, "hover:opacity-90")}
            >
              Continuar Jornada
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default function MissionsMapDashboard() {
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handlePhaseClick = (phase: Phase) => {
    if (phase.status === 'locked') {
      setToastMessage("A disciplina exige paciência. Conclua a fase atual e aguarde o tempo de forja.");
      return;
    }
    setSelectedPhase(phase);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 md:py-6 bg-white border-b border-slate-200 shrink-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">A Jornada</h1>
        <p className="text-sm text-slate-500 mt-1">Siga o caminho da disciplina. Um passo de cada vez.</p>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-24 left-1/2 z-40 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar relative">
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="min-w-max h-full p-10 flex items-center relative"
        >
          {/* Connecting Line Background */}
          <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0"></div>

          <div className="flex items-center gap-24 relative z-10 px-20">
            {MOCK_PHASES.map((phase, index) => {
              const config = ACT_CONFIG[phase.act];
              const isCompleted = phase.status === 'completed';
              const isActive = phase.status === 'active';
              const isLocked = phase.status === 'locked';
              
              const nextPhase = MOCK_PHASES[index + 1];
              const isNextCompletedOrActive = nextPhase?.status === 'completed' || nextPhase?.status === 'active';
              const showSolidLine = isCompleted && isNextCompletedOrActive;

              return (
                <div key={phase.id} className="relative flex flex-col items-center group">
                  
                  {/* Line segment to the next node */}
                  {index < MOCK_PHASES.length - 1 && (
                    <div className={cn(
                      "absolute left-1/2 top-1/2 -translate-y-1/2 h-1 -z-10",
                      showSolidLine ? config.bg : "border-t-2 border-dashed border-slate-300"
                    )} style={{ width: 'calc(6rem + 100%)' }}></div>
                  )}

                  {/* Node */}
                  <button 
                    onClick={() => handlePhaseClick(phase)}
                    className="relative flex flex-col items-center focus:outline-none"
                  >
                    {/* Active Ping Animation */}
                    {isActive && (
                      <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20 scale-150", config.bg)}></div>
                    )}

                    {/* Node Circle */}
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 shadow-sm",
                      isCompleted ? cn(config.bg, "text-white hover:opacity-90 hover:scale-105") :
                      isActive ? cn("bg-gradient-to-br text-white ring-4 ring-white/50 hover:scale-105 shadow-lg", config.gradient, config.glow) :
                      "bg-slate-100 text-slate-400 border-2 border-slate-200 opacity-70 hover:opacity-100"
                    )}>
                      {isCompleted ? (
                        <Check className="w-8 h-8" />
                      ) : isLocked ? (
                        <Lock className="w-6 h-6" />
                      ) : (
                        <phase.icon className="w-8 h-8" />
                      )}
                    </div>

                    {/* Node Label */}
                    <div className="absolute top-full mt-4 flex flex-col items-center w-32 text-center">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest opacity-50 mb-1",
                        isActive || isCompleted ? config.text : "text-slate-400"
                      )}>
                        Ato {phase.act}
                      </span>
                      <span className={cn(
                        "text-sm font-bold tracking-tight",
                        isActive ? config.text : 
                        isCompleted ? "text-slate-700" : "text-slate-400"
                      )}>
                        {phase.title}
                      </span>
                      
                      {/* Time Gate Label */}
                      {isLocked && phase.unlocksInDays && (
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1 bg-slate-100 px-2 py-0.5 rounded-full">
                          Em {phase.unlocksInDays} dias
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <PhaseDetailsModal 
        phase={selectedPhase} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Global styles for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
