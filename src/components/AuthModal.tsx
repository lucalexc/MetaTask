import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [authMode, setAuthMode] = React.useState<AuthMode>(initialMode);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setIsOtpMode(false);
      setOtpCode('');
    }
  }, [isOpen, initialMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (signUpError) {
          toast.error(signUpError.message);
          return;
        }
        
        // Se o signup for bem sucedido, muda para o modo OTP
        setIsOtpMode(true);
        toast.success('Código enviado para seu e-mail!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          toast.error(signInError.message);
          return;
        }

        onClose();
        // Redirect is handled by AuthListener in App.tsx
      }
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup'
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      onClose();
      // Redirect is handled by AuthListener in App.tsx
    } catch (err: any) {
      toast.error(err.message || 'Erro ao verificar o código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      if (error) {
        toast.error(error.message);
        return;
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar com o Google.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative overflow-y-auto max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {isOtpMode ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1.5">
                      Verifique seu e-mail
                    </h2>
                    <p className="text-slate-500 text-sm">
                      Enviamos um código de 6 dígitos para <span className="font-semibold text-slate-700">{email}</span>. Digite-o abaixo para confirmar seu cadastro.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="block w-full pl-9 pr-3 py-3 text-center tracking-[0.5em] text-lg font-mono border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                        placeholder="000000"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || otpCode.length !== 6}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isLoading ? 'Verificando...' : 'Confirmar Código'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsOtpMode(false)}
                      className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Voltar
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {/* Header Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                    <button
                      onClick={() => setAuthMode('login')}
                      className={cn(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                        authMode === 'login' 
                          ? "bg-white text-slate-900 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => setAuthMode('register')}
                      className={cn(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                        authMode === 'register' 
                          ? "bg-white text-slate-900 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Criar Conta
                    </button>
                  </div>

                  {/* Google Button */}
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continuar com o Google
                  </button>

                  {/* Separator */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-slate-400 uppercase tracking-wider font-medium">
                        ou continue com e-mail
                      </span>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {authMode === 'register' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                              placeholder="Nome completo"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                        placeholder="E-mail"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                        placeholder="Senha"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isLoading ? 'Aguarde...' : (authMode === 'login' ? 'Entrar' : 'Cadastrar')}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
