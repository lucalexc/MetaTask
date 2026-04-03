import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings2, CheckCircle2, Headphones, Sparkles, BrainCircuit } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/lib/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { Slider } from '@/src/components/ui/slider';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

const BINAURAL_BEATS = [
  { id: 'alpha', name: 'Ondas Alpha (Foco Relaxado)', freq: 10, desc: 'Ideal para leitura e aprendizado' },
  { id: 'beta', name: 'Ondas Beta (Foco Intenso)', freq: 20, desc: 'Ideal para trabalho analítico e lógico' },
  { id: 'gamma', name: 'Ondas Gamma (Flow State)', freq: 40, desc: 'Ideal para resolução de problemas complexos' }
];

export default function FocusDashboard() {
  const { user } = useAuth();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedBeat, setSelectedBeat] = useState(BINAURAL_BEATS[1]);
  const [sessionCount, setSessionCount] = useState(0);
  
  // Audio context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const timerSettings = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    stopBinauralBeats();
    
    if (mode === 'pomodoro') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      
      // Save session to DB
      if (user) {
        supabase.from('focus_sessions').insert([{
          user_id: user.id,
          duration: timerSettings.pomodoro,
          completed_at: new Date().toISOString(),
          beat_type: selectedBeat.id
        }]).then(({ error }) => {
          if (error) console.error('Error saving focus session:', error);
        });
      }

      if (newCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(timerSettings.longBreak);
      } else {
        setMode('shortBreak');
        setTimeLeft(timerSettings.shortBreak);
      }
    } else {
      setMode('pomodoro');
      setTimeLeft(timerSettings.pomodoro);
    }
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      stopBinauralBeats();
    } else {
      setIsRunning(true);
      if (mode === 'pomodoro' && !isMuted) {
        startBinauralBeats();
      }
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    stopBinauralBeats();
    setTimeLeft(timerSettings[mode]);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(timerSettings[newMode]);
    setIsRunning(false);
    stopBinauralBeats();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Web Audio API for Binaural Beats ---
  const startBinauralBeats = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    stopBinauralBeats(); // Ensure clean state

    const baseFreq = 200; // Carrier frequency (Hz)
    const beatFreq = selectedBeat.freq; // Binaural beat frequency (Hz)

    leftOscRef.current = ctx.createOscillator();
    rightOscRef.current = ctx.createOscillator();
    gainNodeRef.current = ctx.createGain();

    const merger = ctx.createChannelMerger(2);

    leftOscRef.current.type = 'sine';
    rightOscRef.current.type = 'sine';

    leftOscRef.current.frequency.value = baseFreq;
    rightOscRef.current.frequency.value = baseFreq + beatFreq;

    leftOscRef.current.connect(merger, 0, 0); // Left channel
    rightOscRef.current.connect(merger, 0, 1); // Right channel

    merger.connect(gainNodeRef.current);
    gainNodeRef.current.connect(ctx.destination);

    gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100;

    leftOscRef.current.start();
    rightOscRef.current.start();
  };

  const stopBinauralBeats = () => {
    if (leftOscRef.current) {
      leftOscRef.current.stop();
      leftOscRef.current.disconnect();
      leftOscRef.current = null;
    }
    if (rightOscRef.current) {
      rightOscRef.current.stop();
      rightOscRef.current.disconnect();
      rightOscRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopBinauralBeats();
  }, []);

  const progress = ((timerSettings[mode] - timeLeft) / timerSettings[mode]) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
      
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <BrainCircuit className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Foco Absoluto</h1>
        <p className="text-text-secondary">Bloqueie distrações e entre em estado de flow.</p>
      </div>

      {/* Main Focus Area */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)] p-8 relative overflow-hidden">
        
        {/* Progress Background */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-primary/5 transition-all duration-1000 ease-linear"
          style={{ height: `${progress}%` }}
        />

        <div className="relative z-10 flex flex-col items-center">
          
          {/* Mode Selector */}
          <div className="flex items-center gap-2 bg-bg-surface-alt p-1.5 rounded-xl mb-10">
            <button
              onClick={() => changeMode('pomodoro')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                mode === 'pomodoro' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              Foco
            </button>
            <button
              onClick={() => changeMode('shortBreak')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                mode === 'shortBreak' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              Pausa Curta
            </button>
            <button
              onClick={() => changeMode('longBreak')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                mode === 'longBreak' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              Pausa Longa
            </button>
          </div>

          {/* Timer Display */}
          <div className="text-[5rem] font-bold text-text-primary tracking-tighter tabular-nums leading-none mb-10 font-mono">
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={toggleTimer}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                isRunning 
                  ? "bg-white text-primary border-2 border-primary hover:bg-primary/5" 
                  : "bg-primary text-white hover:bg-primary-hover hover:scale-105"
              )}
            >
              {isRunning ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" className="ml-1" />}
            </button>
            
            <button
              onClick={resetTimer}
              className="w-12 h-12 rounded-full bg-bg-surface-alt text-text-secondary flex items-center justify-center hover:bg-border transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Session Counter */}
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>{sessionCount} sessões concluídas hoje</span>
          </div>

        </div>
      </div>

      {/* Audio Controls */}
      <div className="w-full max-w-md mt-6 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text-primary">Sons Binaurais</h3>
          </div>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-surface-alt rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-4">
          {BINAURAL_BEATS.map(beat => (
            <button
              key={beat.id}
              onClick={() => {
                setSelectedBeat(beat);
                if (isRunning && mode === 'pomodoro' && !isMuted) {
                  // Restart audio with new frequency
                  startBinauralBeats();
                }
              }}
              className={cn(
                "w-full flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200",
                selectedBeat.id === beat.id 
                  ? "bg-primary/5 border-primary" 
                  : "bg-white border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={cn("font-semibold text-sm", selectedBeat.id === beat.id ? "text-primary" : "text-text-primary")}>
                  {beat.name}
                </span>
                <span className="text-xs font-mono text-text-muted bg-bg-surface-alt px-2 py-0.5 rounded-md">
                  {beat.freq}Hz
                </span>
              </div>
              <span className="text-xs text-text-muted">{beat.desc}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-4">
            <Volume2 className="w-4 h-4 text-text-muted" />
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={(val) => setVolume(val[0])}
              className="flex-1"
            />
          </div>
          <p className="text-[10px] text-text-muted mt-3 text-center">
            Use fones de ouvido estéreo para o efeito binaural funcionar corretamente.
          </p>
        </div>
      </div>

    </div>
  );
}
