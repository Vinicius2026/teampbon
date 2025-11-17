import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// Função helper para verificar se o usuário é admin
const isAdminUser = (session: any): boolean => {
  if (!session?.user) {
    return false;
  }

  // Verificar role no app_metadata (mais rápido e confiável)
  const role = session.user?.app_metadata?.role;
  
  return role === 'admin';
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const checkAdminAccess = async () => {
      try {
        // Timeout de segurança - se não resolver em 3 segundos, redirecionar
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('[AdminLayout] Timeout ao verificar acesso, redirecionando');
            setChecking(false);
            navigate("/consultoria", { replace: true });
          }
        }, 3000);

        // Obter sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (!isMounted) return;
        
        // Se não há sessão, redirecionar para consultoria (área do usuário)
        if (sessionError || !session) {
          console.log('[AdminLayout] Nenhuma sessão encontrada, redirecionando para /consultoria');
          setChecking(false);
          navigate("/consultoria", { replace: true });
          return;
        }

        // Verificar se o usuário é admin (verificação síncrona rápida)
        const userIsAdmin = isAdminUser(session);
        
        if (!isMounted) return;
        
        if (!userIsAdmin) {
          console.log('[AdminLayout] Usuário não é admin, redirecionando para /consultoria');
          // Não fazer logout - apenas redirecionar para área do usuário
          setChecking(false);
          navigate("/consultoria", { replace: true });
          return;
        }

        // Se chegou aqui, o usuário é admin
        console.log('[AdminLayout] Usuário autenticado como admin');
        setChecking(false);
      } catch (err) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        console.error('[AdminLayout] Erro ao verificar acesso:', err);
        if (isMounted) {
          setChecking(false);
          navigate("/consultoria", { replace: true });
        }
      }
    };

    checkAdminAccess();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (event === 'SIGNED_OUT' || !session) {
        setChecking(false);
        navigate("/adminseven-login", { replace: true });
        return;
      }

      // Verificar se ainda é admin após mudança na sessão
      const userIsAdmin = isAdminUser(session);
      
      if (!isMounted) return;
      
      if (!userIsAdmin) {
        console.log('[AdminLayout] Auth state change: usuário não é admin');
        setChecking(false);
        navigate("/consultoria", { replace: true });
        return;
      }

      setChecking(false);
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 uppercase tracking-wider text-sm">Verificando permissão...</p>
        </div>
      </div>
    );
  }

  const isHome = location.pathname === "/adminseven";
  const isSuporteVisitantes = location.pathname === "/adminseven/suporte-visitantes";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/adminseven-login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-black border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-6 md:fixed md:h-screen md:left-0 md:top-0 z-50 flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">ADMIN</h2>
          <p className="text-xs text-white/60 uppercase tracking-wider mt-1">Painel</p>
        </div>
        <nav className="space-y-2 flex-1">
          <Link 
            className={`block px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all duration-200 ${
              isHome 
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30" 
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
            to="/adminseven"
          >
            Home
          </Link>
          <Link 
            className={`block px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all duration-200 ${
              isSuporteVisitantes 
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30" 
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
            to="/adminseven/suporte-visitantes"
          >
            Suporte Visitante
          </Link>
        </nav>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-auto px-4 py-3 rounded-lg bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-600/50 text-white/80 hover:text-red-400 font-bold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
          Sair
        </button>
      </aside>
      <main className="flex-1 md:ml-64 p-4 md:p-6 bg-black">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;


