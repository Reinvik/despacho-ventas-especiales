import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import LoginPage from './components/LoginPage';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

const ALLOWED_DOMAIN = 'cial.cl';

function Root() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Timeout de seguridad máximo (800ms)
    const timer = setTimeout(() => {
      if (mounted) setAuthLoading(false);
    }, 800);

    // Obtener sesión inicial
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        if (u && u.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
          setUser(u);
        } else if (u) {
          supabase.auth.signOut();
          setUser(null);
        }
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      if (u && u.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        setUser(u);
      } else {
        if (u) supabase.auth.signOut();
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a5c36] flex items-center justify-center font-sans select-none">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white/80 text-xs font-semibold tracking-wider uppercase">Verificando sesión CIAL...</p>
        </div>
      </div>
    );
  }

  return <App currentUser={user} />;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
