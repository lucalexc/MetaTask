import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, 
  History, 
  Save, 
  User, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Zap,
  Flame,
  Wind,
  Droplets,
  Brain,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import { toast } from 'sonner';

type IdentityTab = 'necrologio' | 'temperamento' | 'camadas';
type TestStatus = 'idle' | 'running' | 'finished';
type TemperamentType = 'colerico' | 'sanguineo' | 'melancolico' | 'fleumatico';
type LayerType = 'camada3' | 'camada4' | 'camada5' | 'camada6';

interface NecrologioVersion {
  id: string;
  date: string;
  text: string;
  title: string;
}

const temperamentQuestions = [
  {
    question: "Em uma situação de conflito ou discussão acalorada, qual é a sua reação natural?",
    options: [
      { text: "Enfrento diretamente e quero resolver logo, impondo minha visão.", type: "colerico" },
      { text: "Tento apaziguar, fujo de brigas e busco manter a paz a todo custo.", type: "fleumatico" },
      { text: "Falo bastante, tento contornar com humor, mas logo esqueço a ofensa.", type: "sanguineo" },
      { text: "Fico calado, guardo a mágoa, analiso os detalhes e demoro a perdoar.", type: "melancolico" }
    ]
  },
  {
    question: "Como você se comporta ao iniciar um novo projeto ou trabalho?",
    options: [
      { text: "Faço um planejamento detalhado e busco a perfeição antes de agir.", type: "melancolico" },
      { text: "Assumo a liderança, foco no objetivo final e executo com força.", type: "colerico" },
      { text: "Começo com muita empolgação, mas tenho dificuldade de terminar.", type: "sanguineo" },
      { text: "Faço o que me pedem, no meu ritmo constante, sem me estressar.", type: "fleumatico" }
    ]
  },
  {
    question: "No seu círculo social e em festas, como você é visto?",
    options: [
      { text: "O centro das atenções, falante, carismático e cheio de amigos.", type: "sanguineo" },
      { text: "O observador silencioso, leal a poucos e bons amigos.", type: "melancolico" },
      { text: "O líder do grupo, o que decide onde vamos e o que faremos.", type: "colerico" },
      { text: "O parceiro tranquilo, que topa qualquer coisa e se adapta fácil.", type: "fleumatico" }
    ]
  },
  {
    question: "Como você lida com regras e rotinas estritas?",
    options: [
      { text: "Gosto, pois me dão segurança, previsibilidade e ordem.", type: "melancolico" },
      { text: "Sigo sem reclamar, é mais fácil manter a rotina do que mudar.", type: "fleumatico" },
      { text: "Quebro se achar que não são eficientes. Eu crio minhas regras.", type: "colerico" },
      { text: "Odeio. Rotina me sufoca, preciso de novidade e liberdade.", type: "sanguineo" }
    ]
  },
  {
    question: "Qual é o seu maior ponto fraco ou defeito frequente?",
    options: [
      { text: "Falta de foco, desorganização e superficialidade.", type: "sanguineo" },
      { text: "Impaciência, autoritarismo e insensibilidade com os outros.", type: "colerico" },
      { text: "Pessimismo, excesso de crítica (a si e aos outros) e rancor.", type: "melancolico" },
      { text: "Preguiça, falta de iniciativa e acomodação.", type: "fleumatico" }
    ]
  },
  {
    question: "Ao tomar uma decisão importante, em que você se baseia?",
    options: [
      { text: "Na lógica fria, nos resultados rápidos e na utilidade prática.", type: "colerico" },
      { text: "Na intuição, na emoção do momento e em quem está envolvido.", type: "sanguineo" },
      { text: "Na análise profunda dos riscos, dados e consequências.", type: "melancolico" },
      { text: "No que for mais seguro, confortável e gerar menos dor de cabeça.", type: "fleumatico" }
    ]
  }
];

const temperamentData: Record<TemperamentType, { title: string, desc: string, forces: string[], weaknesses: string[] }> = {
  colerico: {
    title: "Colérico",
    desc: "Lidera e executa. Você é focado, prático e movido a resultados. Nasceu para superar obstáculos e construir coisas duradouras. Sua missão é canalizar essa energia para a construção, evitando que o fogo consuma a si mesmo ou aos outros.",
    forces: ['Liderança', 'Foco', 'Determinação', 'Pragmatismo', 'Coragem'],
    weaknesses: ['Impaciência', 'Ira', 'Orgulho', 'Dureza', 'Intolerância']
  },
  sanguineo: {
    title: "Sanguíneo",
    desc: "Comunica e expande. Você é carismático e cheio de energia. Sua missão é conectar pessoas e levar alegria, mas precisa dominar a dispersão para construir algo duradouro.",
    forces: ['Carisma', 'Otimismo', 'Comunicação', 'Empatia', 'Criatividade'],
    weaknesses: ['Superficialidade', 'Inconstância', 'Exagero', 'Desorganização', 'Impulsividade']
  },
  melancolico: {
    title: "Melancólico",
    desc: "Analisa e aprofunda. Você tem um mundo interior rico, é leal, perfeccionista e busca a excelência. Sua missão é trazer ordem e beleza ao mundo, cuidando para não se afogar no próprio pessimismo.",
    forces: ['Profundidade', 'Lealdade', 'Perfeccionismo', 'Análise', 'Sensibilidade'],
    weaknesses: ['Pessimismo', 'Rancor', 'Crítica excessiva', 'Isolamento', 'Ansiedade']
  },
  fleumatico: {
    title: "Fleumático",
    desc: "Apazigua e observa. Você é a âncora de paz na tempestade, diplomático e altamente adaptável. Sua missão é ser o ponto de equilíbrio, lutando ativamente contra a inércia e a acomodação.",
    forces: ['Paciência', 'Diplomacia', 'Constância', 'Calma', 'Confiabilidade'],
    weaknesses: ['Preguiça', 'Acomodação', 'Indecisão', 'Falta de iniciativa', 'Frieza']
  }
};

const layerQuestions = [
  {
    id: 1,
    question: "Você está em uma reunião e alguém critica duramente uma ideia que você deu. Qual é a sua primeira reação interna?",
    options: [
      { text: "Sinto vergonha. Fico imaginando o que as outras pessoas na sala estão pensando de mim agora.", type: "camada3" },
      { text: "Sinto raiva e ofensa pessoal. Minha vontade imediata é rebater, me defender ou atacar a pessoa de volta.", type: "camada4" },
      { text: "Fico frustrado porque a pessoa não entendeu a parte técnica. Minha vontade é provar logicamente que funciona.", type: "camada5" },
      { text: "Avalio friamente se a crítica tem utilidade prática. Se a ideia da pessoa for melhor para o objetivo final, eu descarto a minha.", type: "camada6" }
    ]
  },
  {
    id: 2,
    question: "Pense em um final de semana onde você está exausto, mas prometeu ajudar um parente com uma mudança. O que te faz ir?",
    options: [
      { text: "O medo de ficar com fama de 'fura-olho' ou de que eles fiquem chateados e parem de me convidar para as coisas.", type: "camada3" },
      { text: "O meu orgulho. Eu odeio dar o braço a torcer ou admitir fraqueza. Vou lá para provar que dou conta.", type: "camada4" },
      { text: "A vontade de organizar as coisas. Chegando lá, vou otimizar o caminhão porque odeio ver serviço mal feito.", type: "camada5" },
      { text: "A simples constatação de que uma promessa foi feita e a pessoa precisa de ajuda. Minha vontade não entra na equação.", type: "camada6" }
    ]
  },
  {
    id: 3,
    question: "Imagine que você perdeu todo o seu dinheiro e o seu emprego de uma vez só. No primeiro dia após o choque, qual é o seu pensamento dominante?",
    options: [
      { text: "'Como eu vou contar isso para os meus amigos/familiares? Vão me ver como um fracassado.'", type: "camada3" },
      { text: "'Isso é humilhante. Não aceito voltar para a estaca zero ou ter que receber ordens de pessoas menores que eu.'", type: "camada4" },
      { text: "'Quais são as minhas habilidades? Se eu consertar X ou vender Y, eu consigo gerar fluxo de caixa em uma semana.'", type: "camada5" },
      { text: "'Quem depende de mim não pode passar fome. O que eu tenho que fazer hoje para colocar pão na mesa?'", type: "camada6" }
    ]
  },
  {
    id: 4,
    question: "Quando você observa uma pessoa extremamente bem-sucedida, o que você mais inveja ou admira nela?",
    options: [
      { text: "O carisma dela. O fato de que todos a adoram, a escutam e querem estar perto dela.", type: "camada3" },
      { text: "A liberdade e o poder inquestionável. O fato de que ela não precisa baixar a cabeça para ninguém.", type: "camada4" },
      { text: "A competência absurda dela. O domínio que ela tem sobre as ferramentas, o trabalho e o mercado.", type: "camada5" },
      { text: "O peso que ela consegue carregar. A capacidade de ser o pilar que sustenta uma família ou uma empresa inteira.", type: "camada6" }
    ]
  },
  {
    id: 5,
    question: "Como você lida com regras burocráticas (no trabalho ou sociedade) que você considera estúpidas?",
    options: [
      { text: "Reclamo com meus colegas para gerar conexão, mas na hora H eu cumpro só para não ser punido ou mal visto.", type: "camada3" },
      { text: "Fico revoltado. Bato de frente ou quebro a regra de propósito só para provar que não sou gado.", type: "camada4" },
      { text: "Crio um 'hack' ou um sistema inteligente para contornar a regra da forma mais eficiente e técnica possível.", type: "camada5" },
      { text: "Cumpro a regra se for meu dever moral ou legal, mesmo achando burra, pois a ordem geral importa mais que minha opinião.", type: "camada6" }
    ]
  },
  {
    id: 6,
    question: "Na maior parte do seu dia, onde a sua atenção está focada?",
    options: [
      { text: "Nas minhas interações sociais. Em quem falou comigo, quem me ignorou, e como eu me encaixo no meu grupo.", type: "camada3" },
      { text: "Nos meus sentimentos, no que fizeram comigo, ou nos meus grandes sonhos de independência.", type: "camada4" },
      { text: "Nos processos. Em como fazer as coisas mais rápido, melhor, aprendendo ferramentas e otimizando minha rotina.", type: "camada5" },
      { text: "Nas minhas obrigações objetivas com as outras pessoas (cônjuge, filhos, clientes). No que precisa ser resolvido no mundo real.", type: "camada6" }
    ]
  },
  {
    id: 7,
    question: "O que é um dia 'perfeito' de descanso para você?",
    options: [
      { text: "Estar rodeado pela minha turma, rindo, sendo aceito e sem me preocupar com julgamentos.", type: "camada3" },
      { text: "Fazer absolutamente o que eu quiser, na hora que eu quiser, sozinho e sem ninguém me cobrando nada.", type: "camada4" },
      { text: "Mergulhar em um hobby complexo (marcenaria, programação), onde vejo minhas habilidades evoluindo.", type: "camada5" },
      { text: "Ter a certeza de que todas as minhas pendências estão sanadas e as pessoas que amo estão seguras sob meu teto.", type: "camada6" }
    ]
  }
];

const layerData: Record<LayerType, { title: string, desc: string, forces: string[], weaknesses: string[] }> = {
  camada3: {
    title: "Camada 3 (Afeto)",
    desc: "Sua motivação principal é a busca por afeto, aceitação e pertencimento. Você age para não ser rejeitado e para agradar aos outros. O desafio é parar de depender da aprovação alheia.",
    forces: ["Empatia", "Sensibilidade", "Acolhimento"],
    weaknesses: ["Dependência Emocional", "Medo de Rejeição", "Falta de Posicionamento"]
  },
  camada4: {
    title: "Camada 4 (Força)",
    desc: "Sua motivação principal é a busca por força, independência e vitória. Você age para provar que é capaz e não depender de ninguém. O desafio é entender que a vida não é apenas uma competição.",
    forces: ["Determinação", "Independência", "Força de Vontade"],
    weaknesses: ["Rebeldia", "Competitividade Exagerada", "Dificuldade em Ceder"]
  },
  camada5: {
    title: "Camada 5 (Utilidade)",
    desc: "Sua motivação principal é a busca por utilidade, competência e excelência técnica. Você age para ser bom no que faz e entregar resultados práticos. O desafio é não se resumir apenas ao seu trabalho.",
    forces: ["Foco no Trabalho", "Busca por Excelência", "Pragmatismo"],
    weaknesses: ["Workaholic", "Frieza Emocional", "Perfeccionismo"]
  },
  camada6: {
    title: "Camada 6 (Dever)",
    desc: "Sua motivação principal é o senso de dever e responsabilidade. Você age para cumprir seus papéis na sociedade (pai, mãe, profissional) e cuidar dos outros. O desafio é não se perder sob o peso das obrigações.",
    forces: ["Responsabilidade", "Maturidade", "Senso de Dever"],
    weaknesses: ["Excesso de Carga", "Esquecimento de Si", "Rigidez"]
  }
};

export default function IdentityDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<IdentityTab>('necrologio');
  const [necrologioText, setNecrologioText] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<NecrologioVersion | null>(null);
  const [necrologioVersions, setNecrologioVersions] = useState<NecrologioVersion[]>([]);
  const [isSavingNecrologio, setIsSavingNecrologio] = useState(false);
  const [isLoadingNecrologio, setIsLoadingNecrologio] = useState(false);
  const [isLoadingTemperament, setIsLoadingTemperament] = useState(false);
  const [isLoadingLayers, setIsLoadingLayers] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [versionToDelete, setVersionToDelete] = useState<NecrologioVersion | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingVersion, setIsDeletingVersion] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    if (user) {
      if (activeTab === 'necrologio') fetchNecrologioVersions(controller.signal);
      if (activeTab === 'temperamento') fetchTemperamentResult(controller.signal);
      if (activeTab === 'camadas') fetchLayerResult(controller.signal);
    }

    return () => controller.abort();
  }, [user, activeTab]);

  const fetchTemperamentResult = async (signal?: AbortSignal) => {
    if (!user) return;
    setIsLoadingTemperament(true);
    try {
      const { data, error } = await supabase
        .from('identity_temperaments')
        .select('result')
        .eq('user_id', user.id)
        .single();

      if (signal?.aborted) return;
      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFinalResult(data.result as TemperamentType);
        setTestStatus('finished');
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Error fetching temperament:', error);
    } finally {
      if (!signal?.aborted) {
        setIsLoadingTemperament(false);
      }
    }
  };

  const fetchLayerResult = async (signal?: AbortSignal) => {
    if (!user) return;
    setIsLoadingLayers(true);
    try {
      const { data, error } = await supabase
        .from('identity_layers')
        .select('result')
        .eq('user_id', user.id)
        .single();

      if (signal?.aborted) return;
      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setLayerFinalResult(data.result as LayerType);
        setLayerTestStatus('finished');
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Error fetching layers:', error);
    } finally {
      if (!signal?.aborted) {
        setIsLoadingLayers(false);
      }
    }
  };

  const fetchNecrologioVersions = async (signal?: AbortSignal) => {
    if (!user) return;
    setIsLoadingNecrologio(true);
    try {
      const { data, error } = await supabase
        .from('identity_necrology')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (signal?.aborted) return;
      if (error) throw error;

      if (data) {
        const formattedVersions = data.map((item: any) => {
          const dateObj = new Date(item.created_at);
          return {
            id: item.id,
            date: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
            title: `Versão ${dateObj.getFullYear()}`,
            text: item.content
          };
        });
        setNecrologioVersions(formattedVersions);
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Error fetching necrology:', error);
    } finally {
      if (!signal?.aborted) {
        setIsLoadingNecrologio(false);
      }
    }
  };

  const handleSaveNecrologio = async () => {
    if (!user || !necrologioText.trim()) return;
    
    setIsSavingNecrologio(true);
    try {
      const { data, error } = await supabase
        .from('identity_necrology')
        .insert([
          { 
            user_id: user.id, 
            content: necrologioText.trim() 
          }
        ])
        .select();

      if (error) throw error;

      setToastMsg('Versão salva com sucesso!');
      setNecrologioText('');
      fetchNecrologioVersions();
      
      setTimeout(() => setToastMsg(''), 3000);
    } catch (error) {
      console.error('Error saving necrology:', error);
      setToastMsg('Erro ao salvar versão.');
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setIsSavingNecrologio(false);
    }
  };

  const handleDeleteVersion = async () => {
    if (!versionToDelete || !user) return;
    setIsDeletingVersion(true);
    try {
      const { error } = await supabase
        .from('identity_necrology')
        .delete()
        .eq('id', versionToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Versão excluída');
      
      setNecrologioVersions(prev => prev.filter(v => v.id !== versionToDelete.id));
      
      if (selectedVersion?.id === versionToDelete.id) {
        setSelectedVersion(null);
      }
    } catch (error: any) {
      console.error('Error deleting version:', error);
      toast.error('Erro ao excluir versão');
    } finally {
      setIsDeletingVersion(false);
      setIsDeleteModalOpen(false);
      setVersionToDelete(null);
    }
  };

  // Temperament Test State
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<TemperamentType, number>>({
    sanguineo: 0,
    colerico: 0,
    fleumatico: 0,
    melancolico: 0
  });
  const [finalResult, setFinalResult] = useState<TemperamentType | null>(null);

  // Layer Test State
  const [layerTestStatus, setLayerTestStatus] = useState<TestStatus>('idle');
  const [currentLayerQuestion, setCurrentLayerQuestion] = useState(0);
  const [layerAnswers, setLayerAnswers] = useState<Record<number, LayerType>>({});
  const [layerFinalResult, setLayerFinalResult] = useState<LayerType | null>(null);

  // Shuffle options to prevent pattern recognition
  const shuffledLayerOptions = useMemo(() => {
    const q = layerQuestions[currentLayerQuestion];
    if (!q) return [];
    const options = [...q.options];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }, [currentLayerQuestion]);

  const handleAnswer = async (type: string) => {
    const tType = type as TemperamentType;
    const newScores = { ...scores, [tType]: scores[tType] + 1 };
    setScores(newScores);

    if (currentQuestion < temperamentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate winner
      let winner: TemperamentType = 'colerico';
      let maxScore = -1;
      (Object.keys(newScores) as TemperamentType[]).forEach(key => {
        if (newScores[key] > maxScore) {
          maxScore = newScores[key];
          winner = key;
        }
      });
      
      setFinalResult(winner);
      setTestStatus('finished');

      // Save to Supabase
      if (user) {
        try {
          const { error } = await supabase
            .from('identity_temperaments')
            .upsert({ 
              user_id: user.id, 
              result: winner 
            }, { onConflict: 'user_id' });

          if (error) throw error;
          setToastMsg('Resultado salvo com sucesso!');
          setTimeout(() => setToastMsg(''), 3000);
        } catch (error) {
          console.error('Error saving temperament:', error);
          setToastMsg('Erro ao salvar resultado.');
          setTimeout(() => setToastMsg(''), 3000);
        }
      }
    }
  };

  const resetTest = () => {
    setTestStatus('idle');
    setCurrentQuestion(0);
    setScores({ sanguineo: 0, colerico: 0, fleumatico: 0, melancolico: 0 });
    setFinalResult(null);
  };

  const handleLayerAnswer = async (type: string) => {
    const lType = type as LayerType;
    const newAnswers = { ...layerAnswers, [currentLayerQuestion]: lType };
    setLayerAnswers(newAnswers);

    if (currentLayerQuestion < layerQuestions.length - 1) {
      setCurrentLayerQuestion(currentLayerQuestion + 1);
    } else {
      const counts: Record<LayerType, number> = {
        camada3: 0,
        camada4: 0,
        camada5: 0,
        camada6: 0
      };
      Object.values(newAnswers).forEach(layer => {
        counts[layer as LayerType]++;
      });

      let winner: LayerType = 'camada3';
      let maxScore = -1;
      
      const layerOrder: LayerType[] = ['camada3', 'camada4', 'camada5', 'camada6'];
      layerOrder.forEach(key => {
        if (counts[key] > maxScore) {
          maxScore = counts[key];
          winner = key;
        }
      });
      
      setLayerFinalResult(winner);
      setLayerTestStatus('finished');
    }
  };

  const saveLayerDiagnosis = async () => {
    if (!user || !layerFinalResult) return;
    try {
      const { error } = await supabase
        .from('identity_layers')
        .upsert({ 
          user_id: user.id, 
          result: layerFinalResult 
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setToastMsg('Anamnese salva com sucesso!');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (error) {
      console.error('Error saving layers:', error);
      setToastMsg('Erro ao salvar anamnese.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const resetLayerTest = () => {
    setLayerTestStatus('idle');
    setCurrentLayerQuestion(0);
    setLayerAnswers({});
    setLayerFinalResult(null);
  };

  const renderNecrologio = () => (
    <div className="flex h-full gap-8 relative">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">O Necrológio</h3>
              <p className="text-xs text-slate-500">Memento Mori: Escreva o seu legado.</p>
            </div>
          </div>
          <button 
            onClick={handleSaveNecrologio}
            disabled={isSavingNecrologio || !necrologioText.trim() || !!selectedVersion}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] text-white rounded-lg text-sm font-semibold hover:bg-[#6D28D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSavingNecrologio ? 'Salvando...' : 'Salvar Versão'}
          </button>
        </div>
        <div className="flex-1 p-8">
          <textarea
            value={selectedVersion ? selectedVersion.text : necrologioText}
            onChange={(e) => !selectedVersion && setNecrologioText(e.target.value)}
            readOnly={!!selectedVersion}
            placeholder="Como você quer ser lembrado no seu funeral? Qual o seu legado? Escreva aqui sem filtros, focando na essência de quem você busca se tornar..."
            className={cn(
              "w-full h-full resize-none text-lg leading-relaxed text-slate-700 placeholder:text-slate-300 focus:outline-none font-serif",
              selectedVersion && "opacity-70"
            )}
          />
        </div>
        {selectedVersion && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm text-slate-700 font-medium">Visualizando: {selectedVersion.title} (Somente Leitura)</span>
            <button 
              onClick={() => setSelectedVersion(null)}
              className="text-xs font-bold text-slate-900 uppercase tracking-wider hover:underline"
            >
              Voltar ao Editor
            </button>
          </div>
        )}
      </div>

      {/* History Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Histórico de Versões</h4>
        <div className="space-y-3 overflow-y-auto pr-2 pb-4">
          {isLoadingNecrologio ? (
            <div className="text-center p-4 text-sm text-slate-500">Carregando histórico...</div>
          ) : necrologioVersions.length > 0 ? (
            necrologioVersions.map((v) => (
              <div key={v.id} className="relative group">
                <button
                  onClick={() => setSelectedVersion(v)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    selectedVersion?.id === v.id 
                      ? "bg-slate-50 border-slate-300 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md"
                  )}
                >
                  <div className="flex justify-between items-start mb-1 pr-6">
                    <span className={cn(
                      "font-bold text-sm",
                      selectedVersion?.id === v.id ? "text-slate-900" : "text-slate-700"
                    )}>{v.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{v.date}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {v.text}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVersionToDelete(v);
                    setIsDeleteModalOpen(true);
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center text-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-[10px] font-medium text-slate-500">Suas versões anteriores aparecerão aqui para você acompanhar sua evolução.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setVersionToDelete(null);
        }}
        onConfirm={handleDeleteVersion}
        title="Excluir Versão"
        description="Tem certeza que deseja excluir esta versão do seu necrológio? Esta ação não poderá ser desfeita."
        isLoading={isDeletingVersion}
      />
    </div>
  );

  const renderTemperamento = () => {
    if (isLoadingTemperament) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Carregando seu perfil...</p>
          </div>
        </div>
      );
    }

    if (testStatus === 'idle') {
      return (
        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center gap-8">
          <div className="w-24 h-24 rounded-3xl bg-orange-50 flex items-center justify-center shadow-inner">
            <Flame className="w-12 h-12 text-orange-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Descubra sua Natureza</h2>
            <p className="text-slate-500 leading-relaxed">
              Os 4 Temperamentos (Colérico, Sanguíneo, Fleumático e Melancólico) são a base biológica da sua personalidade. 
              Entender sua inclinação natural permite que você domine seus impulsos e potencialize suas virtudes.
            </p>
          </div>
          <button 
            onClick={() => setTestStatus('running')}
            className="group flex items-center gap-3 px-5 py-2.5 bg-[#7C3AED] text-white rounded-lg font-semibold shadow-sm hover:bg-[#6D28D9] transition-all hover:scale-105"
          >
            Iniciar Anamnese
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      );
    }

    if (testStatus === 'running') {
      const q = temperamentQuestions[currentQuestion];
      const progress = ((currentQuestion) / temperamentQuestions.length) * 100;

      return (
        <div className="max-w-2xl mx-auto mt-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Pergunta {currentQuestion + 1} de {temperamentQuestions.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: `${((currentQuestion - 1) / temperamentQuestions.length) * 100}%` }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-800 mb-6">
            {q.question}
          </h3>

          <div className="flex flex-col gap-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt.type)}
                className="w-full text-left py-3 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <span className="text-sm text-slate-700">
                  {opt.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (testStatus === 'finished' && finalResult) {
      const resultData = temperamentData[finalResult];
      
      return (
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <span className="text-xs font-bold tracking-widest text-blue-600 mb-2 block uppercase">
            Anamnese Concluída
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 capitalize mb-4">
            {resultData.title}
          </h2>
          <p className="text-slate-600 text-base md:text-lg text-center max-w-2xl mx-auto mb-10 leading-relaxed">
            {resultData.desc}
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100 text-left">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-2 uppercase">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Forças e Virtudes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {resultData.forces.map(f => (
                    <span key={f} className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium border border-emerald-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-2 uppercase">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Pontos de Atenção
                </h4>
                <div className="flex flex-wrap gap-2">
                  {resultData.weaknesses.map(f => (
                    <span key={f} className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm font-medium border border-red-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={resetTest}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-4"
            >
              Refazer teste de temperamento
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderCamadas = () => {
    if (isLoadingLayers) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Carregando sua anamnese...</p>
          </div>
        </div>
      );
    }

    if (layerTestStatus === 'idle') {
      return (
        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center gap-8">
          <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center shadow-inner">
            <Layers className="w-12 h-12 text-blue-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">As 12 Camadas da Personalidade</h2>
            <p className="text-slate-500 leading-relaxed">
              A teoria das 12 camadas descreve o amadurecimento humano. Desde a infância até a vida espiritual, 
              cada camada representa um nível de consciência e responsabilidade. Descobrir sua camada atual é o primeiro passo para o amadurecimento real.
            </p>
          </div>
          <button 
            onClick={() => setLayerTestStatus('running')}
            className="group flex items-center gap-3 px-5 py-2.5 bg-[#7C3AED] text-white rounded-lg font-semibold shadow-sm hover:bg-[#6D28D9] transition-all hover:scale-105"
          >
            Iniciar Anamnese
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      );
    }

    if (layerTestStatus === 'running') {
      const q = layerQuestions[currentLayerQuestion];
      const progress = ((currentLayerQuestion) / layerQuestions.length) * 100;

      return (
        <div className="max-w-2xl mx-auto mt-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Pergunta {currentLayerQuestion + 1} de {layerQuestions.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: `${((currentLayerQuestion - 1) / layerQuestions.length) * 100}%` }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-800 mb-6">
            {q.question}
          </h3>

          <div className="flex flex-col gap-3">
            {shuffledLayerOptions.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleLayerAnswer(opt.type)}
                className="w-full text-left py-3 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <span className="text-sm text-slate-700">
                  {opt.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (layerTestStatus === 'finished' && layerFinalResult) {
      const resultData = layerData[layerFinalResult];
      
      return (
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <span className="text-xs font-bold tracking-widest text-blue-600 mb-2 block uppercase">
            Anamnese Concluída
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 capitalize mb-4">
            {resultData.title}
          </h2>
          <p className="text-slate-600 text-base md:text-lg text-center max-w-2xl mx-auto mb-10 leading-relaxed">
            {resultData.desc}
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100 text-left">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-2 uppercase">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Forças e Virtudes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {resultData.forces.map(f => (
                    <span key={f} className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium border border-emerald-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-2 uppercase">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Pontos de Atenção
                </h4>
                <div className="flex flex-wrap gap-2">
                  {resultData.weaknesses.map(f => (
                    <span key={f} className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm font-medium border border-red-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button 
              onClick={saveLayerDiagnosis}
              className="group flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] text-white rounded-lg font-semibold shadow-sm hover:bg-[#6D28D9] transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-5 h-5" />
              Salvar Diagnóstico
            </button>
            <button 
              onClick={resetLayerTest}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-4"
            >
              Refazer anamnese de camadas
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full flex flex-col bg-slate-50/50 relative">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white text-gray-900 px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 border border-gray-100"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 pt-5 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm">
            <Fingerprint className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Minha Identidade</h1>
            <p className="text-sm text-slate-500 mt-1">A base de toda a sua evolução.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6">
          {[
            { id: 'necrologio', label: 'O Necrológio', icon: History },
            { id: 'temperamento', label: 'Temperamento', icon: Flame },
            { id: 'camadas', label: 'Camadas da Personalidade', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as IdentityTab)}
              className={cn(
                "flex items-center gap-2 pb-3 text-sm font-bold transition-all relative",
                activeTab === tab.id ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {activeTab === 'necrologio' && renderNecrologio()}
          {activeTab === 'temperamento' && renderTemperamento()}
          {activeTab === 'camadas' && renderCamadas()}
        </motion.div>
      </div>
    </div>
  );
}
