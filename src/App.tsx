/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8]">
        <div className="text-[13px] text-[#808080]">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8]">
        <div className="text-[13px] text-[#808080]">Carregando...</div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

import { Toaster } from 'sonner';
import { supabase } from './lib/supabase';
import { useNavigate } from 'react-router-dom';

function AuthListener() {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Prevent redirecting if the user is already inside the app
        // This fixes the issue where resuming a suspended tab resets the view to /app
        if (window.location.pathname === '/' || window.location.pathname === '/login') {
          navigate('/app');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AuthListener />
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/app/:tab" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/app/projects/:projectId" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projetos" element={<Navigate to="/app/projects" replace />} />
          </Routes>
        </Router>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
