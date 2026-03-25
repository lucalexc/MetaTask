import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/src/components/ui/button';
import { 
  CheckCircle2, Target, Zap, Shield, ArrowRight, Play, 
  Brain, Activity, BarChart3, Clock, Sparkles, ChevronDown 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthModal from '@/src/components/AuthModal';
import { cn } from '@/src/lib/utils';

const Reveal = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string, key?: React.Key }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]" />
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled ? "bg-[#06080F]/80 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-2xl tracking-tight text-white">MetaTask</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              className="bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              onClick={() => openAuthModal()}
            >
              Acessar Plataforma
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-40 pb-24 px-6 relative">
          <div className="max-w-5xl mx-auto text-center">
            <Reveal delay={0.1}>
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
                Transforme suas metas em <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
                  missões épicas.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                Pare de procrastinar. Aplique a psicologia dos RPGs e engenharia de vida para construir disciplina inabalável e conquistar seus objetivos.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg h-16 px-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-all duration-300 rounded-2xl"
                  onClick={() => openAuthModal()}
                >
                  Acessar Plataforma
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-lg h-16 px-10 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-2xl backdrop-blur-sm"
                >
                  <Play className="mr-2 w-6 h-6" />
                  Ver como funciona
                </Button>
              </div>
              <p className="mt-6 text-sm text-slate-500">Cancele quando quiser. 7 dias grátis.</p>
            </Reveal>
          </div>
        </section>

        {/* Social Proof Marquee */}
        <section className="py-12 border-y border-white/5 bg-white/5 backdrop-blur-sm overflow-hidden flex relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#06080F] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#06080F] to-transparent z-10" />
          
          <motion.div 
            className="flex gap-16 items-center whitespace-nowrap opacity-50"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
          >
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <div className="text-2xl font-display font-bold text-white">JUNTE-SE A +10.000 REALIZADORES</div>
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="text-2xl font-display font-bold text-white">PRODUTIVIDADE GAMIFICADA</div>
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <div className="text-2xl font-display font-bold text-white">ENGENHARIA DE VIDA</div>
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
              </React.Fragment>
            ))}
          </motion.div>
        </section>

        {/* Problem Section */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-8">
                Listas de tarefas tradicionais <span className="text-red-400">são feitas para falhar.</span>
              </h2>
              <p className="text-xl text-slate-400 mb-16 leading-relaxed">
                Elas geram ansiedade, não priorizam o que importa e não te recompensam pelo esforço. O resultado? Você adia o que é difícil e foca no que é fácil.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8 text-left items-stretch">
              {[
                { icon: Brain, title: "Sobrecarga Cognitiva", desc: "Ver 50 tarefas de uma vez paralisa seu cérebro." },
                { icon: Activity, title: "Falta de Dopamina", desc: "Riscar um item no papel não libera a química da motivação." },
                { icon: Clock, title: "Ausência de Contexto", desc: "Tarefas sem tempo definido viram buracos negros de produtividade." }
              ].map((item, i) => (
                <Reveal key={i} delay={i * 0.1} className="h-full">
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm h-full flex flex-col">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 shrink-0">
                      <item.icon className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-32 px-6 max-w-7xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
          
          <div className="text-center mb-20">
            <Reveal>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">Engenharia de Vida na Prática</h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">Tudo que você precisa para dominar seu tempo, energia e atenção, em um único sistema.</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            {/* Feature 1: Missions */}
            <Reveal className="md:col-span-2 h-full" delay={0.1}>
              <div className="h-full bg-gradient-to-br from-white/5 to-white/[0.02] p-10 rounded-[2rem] border border-white/10 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
                    <Target className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-white mb-4">Missões, não tarefas</h3>
                  <p className="text-lg text-slate-400 mb-8 max-w-md">Agende blocos de tempo precisos. Defina durações e nunca mais perca o controle do seu dia.</p>
                  
                  <div className="mt-auto bg-black/40 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-4 mb-4 opacity-50">
                      <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center bg-blue-500/20">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                      </div>
                      <span className="font-medium line-through text-slate-400">Treino de Força (1h)</span>
                      <span className="ml-auto text-sm text-blue-400">+50 XP</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
                      <span className="font-medium text-white">Deep Work: Projeto X (2h)</span>
                      <span className="ml-auto text-sm text-slate-500">Em progresso...</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Feature 2: Gamification */}
            <Reveal className="h-full" delay={0.2}>
              <div className="h-full bg-gradient-to-br from-white/5 to-white/[0.02] p-10 rounded-[2rem] border border-white/10 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
                    <Zap className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-4">Gamificação Real</h3>
                  <p className="text-slate-400">Ganhe XP, suba de nível e desbloqueie conquistas ao manter sua consistência diária.</p>
                  
                  <div className="mt-auto pt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-emerald-400 font-bold">Nível 12</span>
                      <span className="text-slate-400">2400 / 3000 XP</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Feature 3: Identity */}
            <Reveal className="h-full" delay={0.3}>
              <div className="h-full bg-gradient-to-br from-white/5 to-white/[0.02] p-10 rounded-[2rem] border border-white/10 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30">
                    <Brain className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-4">Identidade</h3>
                  <p className="text-slate-400">Mapeie seu perfil psicológico e adapte o sistema à forma como seu cérebro funciona.</p>
                </div>
              </div>
            </Reveal>

            {/* Feature 4: Focus Mode */}
            <Reveal className="md:col-span-2 h-full" delay={0.4}>
              <div className="h-full bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-10 rounded-[2rem] border border-blue-500/20 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-500/30 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex flex-col h-full justify-center">
                  <h3 className="text-4xl font-display font-bold text-white mb-4">Modo Foco Absoluto</h3>
                  <p className="text-xl text-blue-200 max-w-lg">Bloqueie distrações e entre em estado de flow com nosso timer integrado e sons binaurais.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Aha Moment */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#06080F] via-blue-900/10 to-[#06080F]" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <Reveal>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">
                Não mude você. <span className="text-blue-400">Mude o sistema.</span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                O MetaTask é o único aplicativo que se adapta ao seu cronotipo e perfil de energia. Se você é produtivo à noite, suas missões mais difíceis serão agendadas para a noite.
              </p>
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md inline-block text-left">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🦉</span>
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">Perfil Coruja</div>
                    <div className="text-purple-400 text-sm">Pico de energia: 20h - 02h</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-300 bg-black/30 px-4 py-3 rounded-xl">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <span>09:00 - Tarefas Administrativas (Baixa Energia)</span>
                  </div>
                  <div className="flex items-center gap-3 text-white bg-blue-500/20 border border-blue-500/30 px-4 py-3 rounded-xl">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span className="font-bold">21:00 - Deep Work (Alta Energia)</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-32 px-6 max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white text-center mb-16">Perguntas Frequentes</h2>
          </Reveal>
          <div className="space-y-4">
            {[
              { q: "Já tentei de tudo. Por que isso seria diferente?", a: "Porque não somos uma lista de tarefas. Somos um sistema de accountability. A gamificação atua na dopamina, transformando obrigação em recompensa." },
              { q: "Não tenho tempo para configurar.", a: "O setup leva 3 minutos. Nossa interface é desenhada para fricção zero. Você adiciona uma meta em 2 segundos." },
              { q: "E se eu falhar um dia?", a: "O sistema prevê falhas. Temos o 'Dia de Descanso' e mecânicas de recuperação de streak para você não desanimar." }
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <details className="group bg-white/5 border border-white/10 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-lg text-white">
                    {item.q}
                    <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="px-6 pb-6 text-slate-400 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 relative">
          <Reveal>
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-900 to-purple-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.2)]">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-blue-500/20 to-transparent blur-[100px]" />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8">Pronto para assumir o controle?</h2>
                <p className="text-blue-200 text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light">
                  Junte-se aos realizadores que transformaram suas rotinas. O investimento é menor que um café por semana.
                </p>
                <Button 
                  size="lg" 
                  className="text-lg h-16 px-12 bg-white text-black hover:bg-slate-200 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
                  onClick={() => openAuthModal()}
                >
                  Acessar Plataforma
                </Button>
                <p className="mt-6 text-sm text-blue-300/70">Garantia incondicional de 7 dias.</p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-500 text-sm border-t border-white/10 relative z-10 bg-[#06080F]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-white">MetaTask</span>
          </div>
          <p>© 2026 MetaTask. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
