import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import './LandingPage.css';

export default function LandingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [counterValue, setCounterValue] = useState(0);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        // 1. Partículas no Hero (Canvas)
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let particles: Particle[] = [];
        let animationFrameId: number;

        function resizeCanvas() {
            if (canvas) {
                canvas.width = window.innerWidth;
                const hero = document.querySelector('.hero') as HTMLElement;
                canvas.height = hero ? hero.offsetHeight : window.innerHeight;
            }
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = Math.random() > 0.5 ? 'rgba(99, 102, 241, 0.3)' : 'rgba(139, 92, 246, 0.3)';
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas!.width) this.x = 0;
                if (this.x < 0) this.x = canvas!.width;
                if (this.y > canvas!.height) this.y = 0;
                if (this.y < 0) this.y = canvas!.height;
            }
            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < 60; i++) {
                particles.push(new Particle());
            }
        }

        function animateParticles() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animateParticles);
        }

        initParticles();
        animateParticles();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    useEffect(() => {
        // 2. Intersection Observer para animações de entrada
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        let counterAnimated = false;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // 3. Animação do contador (+10.000)
                    if (entry.target.querySelector('#counter') && !counterAnimated) {
                        counterAnimated = true;
                        animateCounter();
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, observerOptions);

        document.querySelectorAll('.animate').forEach(el => observer.observe(el));

        function animateCounter() {
            const target = 10000;
            const duration = 2000; // 2 segundos
            const steps = 60;
            const stepTime = Math.abs(Math.floor(duration / steps));
            let current = 0;
            
            const timer = setInterval(() => {
                current += target / steps;
                if (current >= target) {
                    setCounterValue(target);
                    clearInterval(timer);
                } else {
                    setCounterValue(Math.floor(current));
                }
            }, stepTime);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // 4. Navbar scroll behavior
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleFaq = (index: number) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <div className="landing-page-wrapper">
            {/* SEÇÃO: NAVBAR */}
            <nav id="navbar" style={{
                background: scrolled ? 'rgba(10, 10, 15, 0.95)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
                <div className="container nav-container">
                    <a href="#" className="logo">MetaTask</a>
                    <button className="hamburger" id="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? '✕' : '☰'}
                    </button>
                    <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="nav-links">
                        <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Funcionalidades</a>
                        <a href="#identidade" onClick={() => setIsMobileMenuOpen(false)}>Identidade</a>
                        <a href="#estatisticas" onClick={() => setIsMobileMenuOpen(false)}>Estatísticas</a>
                        <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
                        <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary nav-cta" style={{ padding: '10px 24px', fontSize: '0.875rem' }}>Acessar Plataforma</button>
                    </div>
                </div>
            </nav>

            {/* SEÇÃO: HERO */}
            <header className="hero">
                <canvas id="hero-canvas" ref={canvasRef}></canvas>
                <div className="container hero-content">
                    <div className="social-proof animate">
                        🏆 Junte-se a <span id="counter">+{counterValue.toLocaleString('pt-BR')}</span> realizadores que já subiram de nível na vida real.
                    </div>
                    <h1 className="hero-headline animate delay-1">Transforme sua vida em um <span className="text-gradient">jogo</span> que você realmente quer vencer.</h1>
                    <p className="subheadline animate delay-2" style={{ marginTop: '24px' }}>Muito mais que uma lista de tarefas. O MetaTask é um sistema completo de produtividade, hábitos, gestão de projetos e autoconhecimento para você parar de procrastinar e construir a vida que deseja.</p>
                    
                    <div className="hero-buttons animate delay-3">
                        <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary">Começar meus 7 dias grátis</button>
                        <a href="#features" className="btn btn-secondary">Ver como funciona ▶</a>
                    </div>
                    <p className="small-text animate delay-3">Cancele a qualquer momento com 1 clique. Sem cartão de crédito.</p>
                </div>
            </header>

            {/* SEÇÃO: TICKER */}
            <div className="ticker-wrap">
                <div className="ticker">
                    JUNTE-SE A +10.000 REALIZADORES &nbsp;•&nbsp; PRODUTIVIDADE GAMIFICADA &nbsp;•&nbsp; ROTINA COM XP &nbsp;•&nbsp; PROJETOS COM KANBAN &nbsp;•&nbsp; VISÃO DE VIDA &nbsp;•&nbsp; AUTOCONHECIMENTO &nbsp;•&nbsp; JUNTE-SE A +10.000 REALIZADORES &nbsp;•&nbsp; PRODUTIVIDADE GAMIFICADA &nbsp;•&nbsp; ROTINA COM XP &nbsp;•&nbsp; PROJETOS COM KANBAN &nbsp;•&nbsp; VISÃO DE VIDA &nbsp;•&nbsp; AUTOCONHECIMENTO &nbsp;•&nbsp;
                </div>
            </div>

            {/* SEÇÃO: O PROBLEMA */}
            <section className="section container" id="problema">
                <div className="text-center animate">
                    <h2 className="section-headline">Por que os aplicativos de produtividade tradicionais falham com você?</h2>
                </div>
                <div className="problems-grid">
                    <div className="problem-card animate delay-1">
                        <div className="problem-icon">🧠</div>
                        <h3>Sobrecarga Cognitiva</h3>
                        <p>Listas infinitas de tarefas que só geram ansiedade e nunca terminam.</p>
                    </div>
                    <div className="problem-card animate delay-2">
                        <div className="problem-icon">⚡</div>
                        <h3>Falta de Dopamina</h3>
                        <p>Riscar um item no papel não traz a recompensa química que seu cérebro precisa para continuar.</p>
                    </div>
                    <div className="problem-card animate delay-3">
                        <div className="problem-icon">🌀</div>
                        <h3>Ausência de Contexto</h3>
                        <p>Você faz por fazer, sem saber como aquela tarefa se conecta com o grande propósito da sua vida.</p>
                    </div>
                </div>
            </section>

            {/* SEÇÃO: POSICIONAMENTO */}
            <section className="positioning-banner animate">
                <div className="container">
                    <h2 className="section-headline">Nós não somos uma lista de tarefas. Somos o seu <span className="text-gradient">sistema operacional pessoal</span>.</h2>
                    <p>O MetaTask une a execução impecável do mundo corporativo com a motivação e a dopamina dos jogos de RPG. Aqui, cada ação tem um propósito, e você é o personagem principal.</p>
                </div>
            </section>

            {/* SEÇÃO: FEATURES */}
            <section className="section container" id="features">
                
                {/* Feature 1: Rotina */}
                <div className="feature-row animate">
                    <div className="feature-content">
                        <span className="feature-tag">ROTINA & XP</span>
                        <h2 className="section-headline">Suba de nível na vida real.</h2>
                        <p className="subheadline">Transforme hábitos chatos em conquistas viciantes. Ganhe XP e mantenha sua ofensiva diária.</p>
                        <ul className="feature-list">
                            <li>Cadastre hábitos e metas diárias no módulo Rotina</li>
                            <li>Ganhe XP ao completar sua rotina e suba de nível</li>
                            <li>Construa um streak (ofensiva) de dias consecutivos</li>
                            <li>Dois tipos: Rotina (hábito recorrente) e Meta (objetivo com prazo em dias)</li>
                            <li>Visualize seu progresso com contador de XP diário</li>
                        </ul>
                        <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary">Começar a ganhar XP →</button>
                    </div>
                    <div className="feature-mockup-wrapper">
                        <div className="mockup-container">
                            <div className="mockup-header">
                                <div className="mockup-dot"></div><div className="mockup-dot"></div><div className="mockup-dot"></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>Nível 12</span>
                                <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>1450 / 2000 XP</span>
                            </div>
                            <div className="mk-xp-bar"><div className="mk-xp-fill"></div></div>
                            
                            <div className="mk-habit">
                                <div className="mk-habit-left">
                                    <div className="mk-check done"></div>
                                    <span style={{ color: '#fff', fontSize: '0.9rem' }}>Ler 10 páginas</span>
                                </div>
                                <span className="mk-badge">+50 XP</span>
                            </div>
                            <div className="mk-habit">
                                <div className="mk-habit-left">
                                    <div className="mk-check"></div>
                                    <span style={{ color: '#fff', fontSize: '0.9rem' }}>Treino de Força</span>
                                </div>
                                <span className="mk-badge">+100 XP</span>
                            </div>
                            <div className="mk-habit">
                                <div className="mk-habit-left">
                                    <div className="mk-check done"></div>
                                    <span style={{ color: '#fff', fontSize: '0.9rem' }}>Meditação (10m)</span>
                                </div>
                                <span className="mk-badge">+30 XP</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 2: Projetos */}
                <div className="feature-row reverse animate">
                    <div className="feature-content">
                        <span className="feature-tag">PROJETOS</span>
                        <h2 className="section-headline">Domine o caos. Execute como um profissional.</h2>
                        <p className="subheadline">Organize tudo em Lista, Kanban ou Calendário. O poder que profissionais exigem, com a simplicidade que você precisa.</p>
                        <ul className="feature-list">
                            <li>Crie até 7 projetos com nome e cor personalizados</li>
                            <li>Três visões por projeto: Lista, Kanban e Calendário</li>
                            <li>Gerencie tarefas com prioridade, categoria, duração e recorrência</li>
                            <li>Separe projetos pessoais dos profissionais com facilidade</li>
                            <li>Navegação semanal integrada para manter o foco no presente</li>
                        </ul>
                        <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary">Organizar meus projetos →</button>
                    </div>
                    <div className="feature-mockup-wrapper">
                        <div className="mockup-container">
                            <div className="mockup-header">
                                <div className="mockup-dot"></div><div className="mockup-dot"></div><div className="mockup-dot"></div>
                            </div>
                            <div className="mk-kanban">
                                <div className="mk-col">
                                    <div className="mk-col-title">A Fazer</div>
                                    <div className="mk-card c1"><div className="mk-line"></div><div className="mk-line short"></div></div>
                                    <div className="mk-card c1"><div className="mk-line"></div></div>
                                </div>
                                <div className="mk-col">
                                    <div className="mk-col-title">Em Progresso</div>
                                    <div className="mk-card c2"><div className="mk-line"></div><div className="mk-line short"></div></div>
                                </div>
                                <div className="mk-col">
                                    <div className="mk-col-title">Concluído</div>
                                    <div className="mk-card c3"><div className="mk-line"></div></div>
                                    <div className="mk-card c3"><div className="mk-line short"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 3: Visão de Vida */}
                <div className="feature-row animate">
                    <div className="feature-content">
                        <span className="feature-tag">VISÃO DE VIDA</span>
                        <h2 className="section-headline">O mapa do tesouro para o seu futuro.</h2>
                        <p className="subheadline">Crie um roadmap visual e emocional do seu futuro. Saiba exatamente por que você está acordando cedo hoje.</p>
                        <ul className="feature-list">
                            <li>Crie sua linha do tempo de vida com marcos de longo prazo</li>
                            <li>Adicione fotos inspiradoras e datas-alvo para cada marco</li>
                            <li>Acompanhe o status: Pendente, Em Andamento ou Concluído</li>
                            <li>Conecte sua execução diária ao seu propósito maior</li>
                            <li>Visualize toda a sua jornada a partir do presente</li>
                        </ul>
                        <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary">Criar minha Visão de Vida →</button>
                    </div>
                    <div className="feature-mockup-wrapper">
                        <div className="mockup-container">
                            <div className="mockup-header">
                                <div className="mockup-dot"></div><div className="mockup-dot"></div><div className="mockup-dot"></div>
                            </div>
                            <div className="mk-roadmap">
                                <div className="mk-timeline"><div className="mk-timeline-fill"></div></div>
                                <div className="mk-nodes">
                                    <div className="mk-node">
                                        <div className="mk-circle done"></div>
                                        <span className="mk-node-text">2024</span>
                                    </div>
                                    <div className="mk-node">
                                        <div className="mk-circle done"></div>
                                        <span className="mk-node-text">Hoje</span>
                                    </div>
                                    <div className="mk-node">
                                        <div className="mk-circle"></div>
                                        <span className="mk-node-text">2026</span>
                                    </div>
                                    <div className="mk-node">
                                        <div className="mk-circle"></div>
                                        <span className="mk-node-text">2030</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '12px' }}>
                                <div style={{ width: '60px', height: '60px', background: 'rgba(99,102,241,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏔️</div>
                                <div>
                                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' }}>Independência Financeira</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Alvo: Dezembro 2030</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 4: Identidade */}
                <div className="feature-row reverse animate" id="identidade">
                    <div className="feature-content">
                        <span className="feature-tag">IDENTIDADE</span>
                        <h2 className="section-headline">Conheça o jogador antes de jogar o jogo.</h2>
                        <p className="subheadline">Ferramentas profundas de autoconhecimento: Necrológio, Temperamentos e as 12 Camadas da Personalidade.</p>
                        
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>📜 O Necrológio (Memento Mori)</h4>
                                <p className="small-text" style={{ marginTop: '4px' }}>Escreva como você quer ser lembrado. Confronte sua mortalidade para dar urgência e sentido ao seu presente. Com histórico de versões para acompanhar sua evolução.</p>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>🔥 Os 4 Temperamentos</h4>
                                <p className="small-text" style={{ marginTop: '4px' }}>Entenda sua natureza base — Colérico, Sanguíneo, Fleumático ou Melancólico — e aprenda como você realmente reage ao mundo.</p>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>🧠 As 12 Camadas da Personalidade</h4>
                                <p className="small-text" style={{ marginTop: '4px' }}>Descubra em qual estágio de maturidade humana você está — da infância até a vida espiritual — e o que precisa fazer para alcançar a próxima camada.</p>
                            </div>
                        </div>
                        <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary">Explorar minha Identidade →</button>
                    </div>
                    <div className="feature-mockup-wrapper">
                        <div className="mockup-container" style={{ paddingBottom: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <div className="mk-stack">
                                <div className="mk-stack-card">
                                    <div className="mk-icon-box">🧠</div>
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>12 Camadas</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Camada 4: História Pessoal</div>
                                    </div>
                                </div>
                                <div className="mk-stack-card">
                                    <div className="mk-icon-box">🔥</div>
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>Temperamento</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Colérico-Melancólico</div>
                                    </div>
                                </div>
                                <div className="mk-stack-card">
                                    <div className="mk-icon-box">📜</div>
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>Necrológio</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Memento Mori. Atualizado há 2 dias.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature 5: Insights */}
                <div className="feature-row animate" id="estatisticas">
                    <div className="feature-content">
                        <span className="feature-tag">ESTATÍSTICAS</span>
                        <h2 className="section-headline">Seus resultados não mentem.</h2>
                        <p className="subheadline">Acompanhe seu tempo de foco, dias mais produtivos e evolução contínua através de gráficos detalhados.</p>
                        <ul className="feature-list">
                            <li>Visualize onde você está investindo seu tempo</li>
                            <li>Gráfico de ritmo diário (minutos focados por dia)</li>
                            <li>Filtros: Últimos 7 dias ou Este Mês</li>
                            <li>Dados reais para decisões inteligentes sobre sua rotina</li>
                        </ul>
                        <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary">Ver minhas estatísticas →</button>
                    </div>
                    <div className="feature-mockup-wrapper">
                        <div className="mockup-container">
                            <div className="mockup-header">
                                <div className="mockup-dot"></div><div className="mockup-dot"></div><div className="mockup-dot"></div>
                            </div>
                            <div className="mk-grid">
                                <div className="mk-stat">
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>⏱️ Tempo de Foco</div>
                                    <div className="mk-stat-val">12h 45m</div>
                                </div>
                                <div className="mk-stat">
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>⚡ Ofensiva (Streak)</div>
                                    <div className="mk-stat-val" style={{ color: 'var(--color-warning)' }}>14 Dias</div>
                                </div>
                                <div className="mk-stat">
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>✅ Tarefas</div>
                                    <div className="mk-stat-val">42</div>
                                </div>
                                <div className="mk-stat">
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>📅 Melhor Dia</div>
                                    <div className="mk-stat-val">Terça</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Ritmo Diário (Minutos)</div>
                            <div className="mk-chart">
                                <div className="mk-bar" style={{ height: '40%' }}></div>
                                <div className="mk-bar" style={{ height: '70%' }}></div>
                                <div className="mk-bar" style={{ height: '50%' }}></div>
                                <div className="mk-bar" style={{ height: '90%', background: 'var(--color-primary)' }}></div>
                                <div className="mk-bar" style={{ height: '30%' }}></div>
                                <div className="mk-bar" style={{ height: '60%' }}></div>
                                <div className="mk-bar" style={{ height: '80%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            {/* SEÇÃO: FAQ */}
            <section className="section section-alt" id="faq">
                <div className="container faq-container animate">
                    <div className="text-center">
                        <h2 className="section-headline">Perguntas Frequentes</h2>
                        <p className="subheadline">Tudo o que você precisa saber sobre o MetaTask.</p>
                    </div>

                    <div className="faq-list" style={{ marginTop: '40px' }}>
                        
                        {[
                            {
                                q: "Qual a diferença entre Tarefas e Rotina no MetaTask?",
                                a: "As Tarefas são ações pontuais organizadas dentro de Projetos (como \"Enviar relatório\" ou \"Comprar passagem\"). Já a Rotina é onde a gamificação acontece: são seus hábitos e metas diárias. Ao completar sua Rotina você acumula XP, sobe de nível e constrói seu streak."
                            },
                            {
                                q: "O que é a Visão de Vida?",
                                a: "É o seu mapa do tesouro pessoal. Uma ferramenta visual onde você define marcos de longo prazo, adiciona fotos inspiradoras e estabelece datas-alvo. Ela serve para te lembrar todos os dias do porquê você está executando suas tarefas e rotinas."
                            },
                            {
                                q: "O que são as ferramentas de Identidade?",
                                a: "O MetaTask acredita que produtividade sem autoconhecimento é vazia. Nosso módulo de Identidade inclui três ferramentas: o Necrológio (prática estóica de Memento Mori), a descoberta dos 4 Temperamentos base e o mapeamento das 12 Camadas da Personalidade."
                            },
                            {
                                q: "Como funciona a gamificação com XP?",
                                a: "Você ganha XP ao ser consistente. Ao marcar seus hábitos e metas diárias na Rotina como concluídos, seu personagem sobe de nível e você constrói um streak de dias seguidos. É a dopamina dos videogames aplicada ao seu crescimento real."
                            },
                            {
                                q: "Existe limite de projetos?",
                                a: "No plano atual você pode criar até 7 projetos simultâneos, cada um com suas próprias visões em Lista, Kanban e Calendário."
                            },
                            {
                                q: "Como funciona o período de teste?",
                                a: "Você tem 7 dias inteiros para usar 100% das ferramentas do MetaTask de forma totalmente gratuita. Se não gostar, cancele com um clique antes do fim do período — nada será cobrado, sem burocracia."
                            },
                            {
                                q: "O MetaTask serve para trabalho ou vida pessoal?",
                                a: "Para ambos! O módulo de Projetos com Kanban é robusto para demandas profissionais, enquanto Rotina, Visão de Vida e Identidade garantem que sua vida pessoal e saúde mental evoluam em paralelo."
                            }
                        ].map((item, index) => (
                            <div className={`faq-item ${activeFaq === index ? 'active' : ''}`} key={index} style={{ borderColor: activeFaq === index ? 'var(--color-primary)' : 'var(--color-border)' }}>
                                <button className="faq-question" onClick={() => toggleFaq(index)}>
                                    {item.q}
                                    <span className="faq-icon">+</span>
                                </button>
                                <div className="faq-answer">
                                    <p>{item.a}</p>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </section>

            {/* SEÇÃO: CTA FINAL */}
            <section className="container animate">
                <div className="cta-final">
                    <h2>Pronto para iniciar sua jornada épica?</h2>
                    <p>Pare de adiar a vida que você planejou. Teste o sistema completo do MetaTask gratuitamente por 7 dias.</p>
                    <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-white">Desbloquear meu acesso grátis agora</button>
                    <p className="small-text" style={{ marginTop: '16px', color: 'rgba(255,255,255,0.7)' }}>7 dias grátis • Sem cartão de crédito • Cancele quando quiser</p>
                </div>
            </section>

            {/* FOOTER */}
            <footer>
                <div className="container">
                    <div className="footer-logo">MetaTask</div>
                    <p className="footer-tagline">O seu sistema operacional pessoal.</p>
                    <div className="footer-links">
                        <a href="#">Termos de Uso</a>
                        <a href="#">Política de Privacidade</a>
                        <a href="#">Suporte</a>
                    </div>
                    <p className="copyright">© 2025 MetaTask. Todos os direitos reservados.</p>
                </div>
            </footer>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
}
