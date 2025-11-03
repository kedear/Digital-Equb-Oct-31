
import React, { useState, useMemo, useEffect } from 'react';
import { AuthView } from './components/AuthView';
import { AdminView } from './components/AdminView';
import { MemberView } from './components/MemberView';
import { LandingPage } from './components/LandingPage';
import { Role, UserProfile } from './types';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { DataProvider } from './components/DataProvider';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
// FIX: Corrected typo `React.create-context` to `React.createContext`.
export const ThemeContext = React.createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => console.warn('no theme provider'),
});

type ViewMode = 'landing' | 'auth' | 'app';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [loading, setLoading] = useState(true);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if(session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setCurrentUser(profile);
        setIsEmailConfirmed(!!session.user.email_confirmed_at);
        setViewMode('app');
      }
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setCurrentUser(profile);
          setIsEmailConfirmed(!!session.user.email_confirmed_at);
          setViewMode('app');
        } else {
          setCurrentUser(null);
          setIsEmailConfirmed(false);
          setViewMode('landing');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const themeContextValue = useMemo(() => ({ theme, toggleTheme }), [theme]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!session || !currentUser) {
        if (viewMode === 'landing') {
            return <LandingPage onAuthNavigate={() => setViewMode('auth')} />;
        }
        return <AuthView onBackToHome={() => setViewMode('landing')} />;
    }

    return (
      <DataProvider user={currentUser} isEmailConfirmed={isEmailConfirmed}>
        {currentUser.role === Role.Admin ? <AdminView /> : <MemberView />}
      </DataProvider>
    );
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div className="min-h-screen bg-light-bg dark:bg-brand-dark font-sans text-light-text-primary dark:text-dark-text-primary">
        {renderContent()}
      </div>
    </ThemeContext.Provider>
  );
};

export default App;