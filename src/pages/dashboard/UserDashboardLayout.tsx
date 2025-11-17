import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import logoTeamPB from "@/assets/team-pb-20-logo-4.png";

type UserProfile = {
  nome_completo: string | null;
  tipo_usuario: string | null;
  plano_contratado: string | null;
  objetivo: string | null;
  data_expiracao: string | null;
  data_entrada: string | null;
  data_termino: string | null;
  acesso_bloqueado: boolean | null;
  acesso_valido: boolean | null;
};

const UserDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);

  // Função helper para formatar datas
  const formatarData = (data: string | null | undefined): string => {
    if (!data) return '';
    try {
      const dataObj = new Date(data);
      if (isNaN(dataObj.getTime())) return data;
      return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return data;
    }
  };

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate("/consultoria");
        return;
      }

      setSession(sessionData.session);

      try {
        // Buscar perfil do usuário
        const { data: profileData, error: profileError } = await supabase
          .from("user_profile")
          .select("*")
          .single();

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError);
          // Tentar buscar nome do user_metadata como fallback
          // NÃO usar email como fallback - apenas user_metadata ou "Usuário"
          const userMetadata = sessionData.session.user.user_metadata;
          if (userMetadata?.nome_completo && userMetadata.nome_completo.trim() !== '') {
            setProfile({
              nome_completo: userMetadata.nome_completo.trim(),
              tipo_usuario: sessionData.session.user.app_metadata?.role || "consultoria",
              plano_contratado: null,
              objetivo: null,
              data_expiracao: null,
              data_entrada: null,
              data_termino: null,
              acesso_bloqueado: false,
              acesso_valido: true,
            });
          } else {
            // Se não tiver nome, mostrar "Usuário" (não o email)
            setProfile({
              nome_completo: "Usuário",
              tipo_usuario: sessionData.session.user.app_metadata?.role || "consultoria",
              plano_contratado: null,
              objetivo: null,
              data_expiracao: null,
              data_entrada: null,
              data_termino: null,
              acesso_bloqueado: false,
              acesso_valido: true,
            });
          }
        } else {
          // Verificar se acesso está válido
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          
          let acessoValido = true;
          
          // Verificar se está bloqueado
          if (profileData.acesso_bloqueado) {
            acessoValido = false;
          }
          
          // Verificar se expirou
          if (profileData.data_expiracao) {
            const dataExpiracao = new Date(profileData.data_expiracao);
            dataExpiracao.setHours(0, 0, 0, 0);
            
            if (dataExpiracao < hoje) {
              acessoValido = false;
            }
          }
          
          // Se acesso não está válido, deslogar e redirecionar
          if (!acessoValido) {
            await supabase.auth.signOut();
            navigate("/consultoria", { 
              state: { 
                error: "Seu acesso expirou ou foi bloqueado. Entre em contato com o administrador." 
              } 
            });
            return;
          }
          
          // Se não tiver nome_completo no profile, tentar buscar do user_metadata
          // NÃO usar email como fallback - apenas user_metadata ou "Usuário"
          if (!profileData?.nome_completo || profileData.nome_completo.trim() === '') {
            const userMetadata = sessionData.session.user.user_metadata;
            if (userMetadata?.nome_completo && userMetadata.nome_completo.trim() !== '') {
              profileData.nome_completo = userMetadata.nome_completo.trim();
            } else {
              // Se não tiver nome em lugar nenhum, mostrar "Usuário" (não o email)
              profileData.nome_completo = "Usuário";
            }
          }
          
          profileData.acesso_valido = acessoValido;
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        // Fallback para dados básicos da sessão
        // NÃO usar email como fallback - apenas user_metadata ou "Usuário"
        const userMetadata = sessionData.session?.user?.user_metadata;
        if (userMetadata?.nome_completo && userMetadata.nome_completo.trim() !== '') {
          setProfile({
            nome_completo: userMetadata.nome_completo.trim(),
            tipo_usuario: sessionData.session?.user?.app_metadata?.role || "consultoria",
            plano_contratado: null,
            objetivo: null,
            data_expiracao: null,
            data_entrada: null,
            data_termino: null,
            acesso_bloqueado: false,
            acesso_valido: true,
          });
        } else {
          setProfile({
            nome_completo: "Usuário",
            tipo_usuario: sessionData.session?.user?.app_metadata?.role || "consultoria",
            plano_contratado: null,
            objetivo: null,
            data_expiracao: null,
            data_entrada: null,
            data_termino: null,
            acesso_bloqueado: false,
            acesso_valido: true,
          });
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [navigate]);

  // Carregar contador de mensagens não lidas de suporte
  useEffect(() => {
    const loadMensagensNaoLidas = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user?.id) return;

        const { data, error } = await supabase.rpc("contar_mensagens_suporte_nao_lidas", {
          p_user_id: sessionData.session.user.id,
        });

        if (error) {
          console.error("Erro ao carregar mensagens não lidas:", error);
          return;
        }

        setMensagensNaoLidas(data || 0);
      } catch (err) {
        console.error("Erro:", err);
      }
    };

    if (session?.user?.id) {
      loadMensagensNaoLidas();
      // Atualizar a cada 30 segundos
      const interval = setInterval(loadMensagensNaoLidas, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/consultoria");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 uppercase tracking-wider text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: "HOME", path: "/dashboard" },
    { label: "HISTÓRICO", path: "/dashboard/historico" },
    { label: "DIETA", path: "/dashboard/dieta" },
    { label: "TREINO", path: "/dashboard/treino" },
    { label: "SUPORTE", path: "/dashboard/suporte", badge: mensagensNaoLidas > 0 ? mensagensNaoLidas : null },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Sidebar - Mobile: oculta, Desktop: fixa */}
      <aside className="w-full md:w-64 bg-black border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-6 flex flex-col md:fixed md:h-screen md:left-0 md:top-0 z-50">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-center">
            <img 
              src={logoTeamPB} 
              alt="TEAM PB Logo" 
              className="h-16 md:h-20 w-auto object-contain"
            />
          </div>
          <p className="text-xs text-white/60 uppercase tracking-wider mt-3 text-center">Dashboard</p>
        </div>

        {/* Informações do usuário */}
        <div className="mb-6 md:mb-8 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
          <div className="text-sm space-y-3">
            <div>
              <span className="text-white/60 text-xs uppercase tracking-wider">Nome</span>
              <p className="font-bold text-white truncate mt-1">
                {profile?.nome_completo && profile.nome_completo.trim() !== '' 
                  ? profile.nome_completo.trim() 
                  : "Usuário"}
              </p>
            </div>
            {profile?.plano_contratado && (
              <div>
                <span className="text-white/60 text-xs uppercase tracking-wider">Plano</span>
                <p className="font-black text-red-500 mt-1 text-lg">{profile.plano_contratado}</p>
              </div>
            )}
            {profile?.data_entrada && (
              <div>
                <span className="text-white/60 text-xs uppercase tracking-wider">Entrou</span>
                <p className="text-sm text-white/90 mt-1 font-medium">
                  {formatarData(profile.data_entrada)}
                </p>
              </div>
            )}
            {profile?.data_termino && (
              <div>
                <span className="text-white/60 text-xs uppercase tracking-wider">Fim do plano</span>
                <p className="text-sm text-white/90 mt-1 font-medium">
                  {formatarData(profile.data_termino)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all duration-200 relative group ${
                  isActive
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black min-w-[28px] text-center ${
                      isActive 
                        ? "bg-white text-red-600" 
                        : "bg-red-600 text-white"
                    }`}>
                      {item.badge.toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-4 w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-600/50 text-white/80 hover:text-red-400 font-bold text-sm uppercase tracking-wide transition-all duration-200"
        >
          Sair
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-auto bg-black">
        <Outlet />
      </main>
    </div>
  );
};

export default UserDashboardLayout;

