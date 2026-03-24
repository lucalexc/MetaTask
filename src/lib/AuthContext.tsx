import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's an auth hash in the URL
    const hasAuthHash = window.location.hash.includes('access_token=') || 
                        window.location.hash.includes('refresh_token=') ||
                        window.location.hash.includes('error_description=');

    let timeoutId: NodeJS.Timeout;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If there's a hash, wait for onAuthStateChange to handle it
      // unless getSession already resolved the session
      if (!hasAuthHash || session) {
        setIsLoading(false);
      } else {
        // Fallback timeout if onAuthStateChange doesn't fire
        timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
