import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/src/components/ui/button';
import { CheckCircle2, Target, Zap, Shield, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthModal from '@/src/components/AuthModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authMode} />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MetaTask</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => openAuthModal('login')}>
              Entrar
            </Button>
            <Button onClick={() => openAuthModal('register')}>Começar Jornada</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              O Sistema Operacional da sua Rotina
            </span>
            <h1 className="text-5xl sm:text-7xl font-display font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              Transforme suas metas em <span className="text-blue-600">missões épicas.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Pare de procrastinar. Aplique a psicologia dos RPGs e engenharia de vida para construir disciplina inabalável e conquistar seus objetivos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8" onClick={() => openAuthModal('register')}>
                Começar Jornada - R$ 18/mês
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8">
                <Play className="mr-2 w-5 h-5" />
                Ver como funciona
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">Cancele quando quiser. 7 dias grátis.</p>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-6">
            Junte-se a +10.000 realizadores
          </p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 opacity-50 grayscale">
            {/* Logos placeholders */}
            <div className="text-xl font-bold">TechCorp</div>
            <div className="text-xl font-bold">Innovate.io</div>
            <div className="text-xl font-bold">FutureWorks</div>
            <div className="text-xl font-bold">GrowthLabs</div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">Engenharia de Vida na Prática</h2>
          <p className="text-lg text-slate-600">Tudo que você precisa para dominar seu tempo e energia.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">Motor de Tarefas Inteligente</h3>
            <p className="text-slate-600 mb-6">Agende blocos de tempo precisos. Defina durações, recorrências complexas e nunca mais perca o controle do seu dia.</p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded-full border-2 border-blue-600"></div>
                <span className="font-medium line-through text-slate-500">Treino de Força (1h)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                <span className="font-medium">Deep Work: Projeto X (2h)</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">Gamificação Real</h3>
            <p className="text-slate-600">Ganhe XP, suba de nível e desbloqueie conquistas ao manter sua consistência.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">Accountability</h3>
            <p className="text-slate-600">Check-ins noturnos para refletir sobre o dia e preparar a meta de amanhã.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-slate-900 p-8 rounded-3xl shadow-sm text-white relative overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="text-2xl font-display font-bold mb-3">Modo Foco Absoluto</h3>
              <p className="text-slate-400 max-w-md">Bloqueie distrações e entre em estado de flow com nosso timer integrado e sons binaurais.</p>
            </div>
            {/* Decorative elements */}
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
          </motion.div>
        </div>
      </section>

      {/* Objection Handling */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Por que o MetaTask funciona?</h2>
          <div className="space-y-6">
            {[
              { q: "Já tentei de tudo. Por que isso seria diferente?", a: "Porque não somos uma lista de tarefas. Somos um sistema de accountability. A gamificação atua na dopamina, transformando obrigação em recompensa." },
              { q: "Não tenho tempo para configurar.", a: "O setup leva 3 minutos. Nossa interface é desenhada para fricção zero. Você adiciona uma meta em 2 segundos." },
              { q: "E se eu falhar um dia?", a: "O sistema prevê falhas. Temos o 'Dia de Descanso' e mecânicas de recuperação de streak para você não desanimar." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold mb-2">{item.q}</h4>
                  <p className="text-slate-600">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto bg-blue-600 rounded-3xl p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-display font-bold mb-6">Pronto para assumir o controle?</h2>
            <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
              Junte-se aos realizadores que transformaram suas rotinas. O investimento é menor que um café por semana.
            </p>
            <Button size="lg" variant="secondary" className="text-lg h-14 px-8 text-blue-700 hover:bg-white" onClick={() => openAuthModal('register')}>
              Começar Jornada - R$ 18/mês
            </Button>
            <p className="mt-4 text-sm text-blue-200">Garantia incondicional de 7 dias.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-200 bg-white">
        <p>© 2026 MetaTask. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
