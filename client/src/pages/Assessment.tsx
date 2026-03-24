import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubmitAssessment } from "@/hooks/use-tracks";
import { Button } from "@/components/Button";
import { GlassCard } from "@/components/GlassCard";
import { ProgressBar } from "@/components/ProgressBar";
import { useLocation } from "wouter";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Slider } from "@/components/ui/slider";

// Assessment Configuration
const SECTIONS = [
  {
    id: "bio",
    title: "Biological Resources",
    description: "Your physical foundation and energy.",
    questions: [
      { id: "fitness", type: "select", label: "How would you define your fitness?", options: ["Sedentary", "Active", "Athlete", "Elite"] },
      { id: "diet", type: "slider", label: "How healthy is your diet (1-10)?", min: 1, max: 10 },
      { id: "sleep", type: "select", label: "How is your sleep quality?", options: ["Poor", "Average", "Good", "Excellent"] }
    ]
  },
  {
    id: "resources",
    title: "Material Resources",
    description: "Your financial and career stability.",
    questions: [
      { id: "finance", type: "select", label: "Financial Status", options: ["Debt", "Stable", "Saver", "Investor"] },
      { id: "career", type: "select", label: "Career Satisfaction", options: ["Unsatisfied", "Neutral", "Satisfied", "Fulfilled"] }
    ]
  },
  {
    id: "mind",
    title: "Mental & Spiritual",
    description: "Your inner world and resilience.",
    questions: [
      { id: "stress", type: "slider", label: "Ability to handle stress (1-10)?", min: 1, max: 10 },
      { id: "clarity", type: "select", label: "Sense of purpose", options: ["Lost", "Searching", "Clear", "Driven"] }
    ]
  }
];

export default function Assessment() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isComputing, setIsComputing] = useState(false);
  
  const submitAssessment = useSubmitAssessment();
  const [_, setLocation] = useLocation();

  const currentSection = SECTIONS[currentSectionIndex];
  const currentQuestion = currentSection.questions[currentQuestionIndex];
  
  // Progress calculation
  const totalQuestions = SECTIONS.reduce((acc, sec) => acc + sec.questions.length, 0);
  const completedQuestions = SECTIONS.slice(0, currentSectionIndex).reduce((acc, sec) => acc + sec.questions.length, 0) + currentQuestionIndex;
  const progress = (completedQuestions / totalQuestions) * 100;

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = async () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < SECTIONS.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Complete!
      setIsComputing(true);
      await finishAssessment();
    }
  };

  const finishAssessment = async () => {
    // Logic: If Sedentary or Debt -> Level 1. Else -> Level 2.
    let level = 2;
    if (answers.fitness === "Sedentary" || answers.finance === "Debt") {
      level = 1;
    }

    try {
      await submitAssessment.mutateAsync({ answers, recommendedLevel: level });
      setLocation("/");
    } catch (e) {
      console.error(e);
      setIsComputing(false);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      setCurrentQuestionIndex(SECTIONS[currentSectionIndex - 1].questions.length - 1);
    }
  };

  if (isComputing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF8] p-6">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-[#1f60c2] border-t-transparent rounded-full mb-4"
        />
        <h2 className="text-[14px] leading-[22px] font-bold text-[#202020]">Designing your track...</h2>
        <p className="text-[#808080] text-[13px] leading-[18px] mt-2 font-normal">Based on your answers</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF8] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 right-0 h-2">
        <ProgressBar progress={progress} className="rounded-none h-2" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full z-10">
        <motion.div
          key={currentSection.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mb-8 text-center"
        >
          <span className="text-[12px] font-bold tracking-wider text-[#1f60c2] uppercase mb-2 block">
            Part {currentSectionIndex + 1} of {SECTIONS.length}
          </span>
          <h1 className="text-[26px] leading-[35px] font-bold text-[#202020] mb-2">{currentSection.title}</h1>
          <p className="text-[#808080] text-[13px] leading-[18px] font-normal">{currentSection.description}</p>
        </motion.div>

        <GlassCard className="w-full min-h-[400px] flex flex-col justify-between p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <h3 className="text-[16px] md:text-[18px] font-bold text-[#202020] mb-8">{currentQuestion.label}</h3>

              {currentQuestion.type === "select" && (
                <div className="grid gap-3">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`text-left bg-white border rounded-lg p-4 transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] shadow-sm ${
                        answers[currentQuestion.id] === option
                          ? "border-[#1f60c2] bg-[#f0f6ff] text-[#1f60c2]"
                          : "border-gray-200 hover:border-[#1f60c2] text-[#202020] hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] leading-[18px] font-bold">{option}</span>
                        {answers[currentQuestion.id] === option && <Check className="w-4 h-4" strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "slider" && (
                <div className="py-12 px-4">
                  <div className="text-[26px] leading-[35px] font-bold text-center mb-8 text-[#1f60c2]">
                    {answers[currentQuestion.id] || currentQuestion.min} / {currentQuestion.max}
                  </div>
                  <Slider 
                    value={[answers[currentQuestion.id] || currentQuestion.min]}
                    min={currentQuestion.min}
                    max={currentQuestion.max}
                    step={1}
                    onValueChange={(vals) => handleAnswer(vals[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-4 text-[13px] leading-[18px] text-[#808080] font-normal">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/50">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
            >
              {currentSectionIndex === SECTIONS.length - 1 && currentQuestionIndex === currentSection.questions.length - 1 ? (
                "Complete Assessment"
              ) : (
                <>Next <ChevronRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
