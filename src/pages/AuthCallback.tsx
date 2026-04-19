import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getSupabaseClient, syncStoredSupabaseAccessToken } from '@/lib/supabase';
import { getChamaState } from '@/lib/chama';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      let supabase;
      try {
        supabase = getSupabaseClient();
      } catch (error) {
        console.error('Supabase config error:', error);
        navigate('/login');
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        navigate('/login');
        return;
      }
      if (session) {
        await syncStoredSupabaseAccessToken();
        const state = getChamaState();
        navigate(state.onboardingComplete ? '/app/dashboard' : '/welcome', { replace: true });
      } else {
        navigate('/login');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-xl">K</span>
        </div>
        <p className="text-muted-foreground text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
