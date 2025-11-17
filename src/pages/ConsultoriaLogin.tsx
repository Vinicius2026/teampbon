import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import logoTeamPB from "@/assets/team-pb-20-logo-4.png";

const ConsultoriaLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há mensagem de erro vinda do state (após redirecionamento)
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }

    // Se o usuário já está logado, redirecionar para dashboard
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Verificar se não é admin (se for admin, não redirecionar)
        const role = session.user?.app_metadata?.role;
        if (role !== 'admin') {
          // Verificar se formulário foi preenchido
          const { data: cadastro } = await supabase
            .from("consultoria_cadastros")
            .select("form_preenchido")
            .eq("user_id", session.user.id)
            .maybeSingle();
          
          if (cadastro?.form_preenchido) {
            navigate("/dashboard");
          } else {
            navigate("/consultoria-cadastro");
          }
        }
      }
    };
    checkSession();
  }, [location.state, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message || "Email ou senha inválidos.");
        setLoading(false);
        return;
      }
      
      if (!data?.user) {
        setError("Email ou senha inválidos.");
        setLoading(false);
        return;
      }

      // Verificar se usuário completou o formulário e se o acesso está válido
      const { data: cadastro, error: cadastroError } = await supabase
        .from("consultoria_cadastros")
        .select("form_preenchido, id, data_expiracao, acesso_bloqueado")
        .eq("user_id", data.user.id)
        .maybeSingle();

      // Verificar se acesso está expirado ou bloqueado
      if (cadastro) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Verificar se está bloqueado
        if (cadastro.acesso_bloqueado) {
          setError("Seu acesso foi bloqueado. Entre em contato com o administrador.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Verificar se expirou
        if (cadastro.data_expiracao) {
          const dataExpiracao = new Date(cadastro.data_expiracao);
          dataExpiracao.setHours(0, 0, 0, 0);
          
          if (dataExpiracao < hoje) {
            setError("Seu acesso expirou. Entre em contato com o administrador para renovar.");
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
        }
      }

      // Se não encontrou registro ou formulário não foi preenchido, redireciona para cadastro
      if (cadastroError || !cadastro || cadastro.form_preenchido === false || cadastro.form_preenchido === null) {
        navigate("/consultoria-cadastro");
      } else {
        // Formulário já preenchido, vai para dashboard
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Falha ao acessar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden py-8">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]"></div>
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="w-full max-w-md relative z-10 group">
        {/* Logo acima do formulário */}
        <div className="flex justify-center mb-10 -mt-8">
          <img 
            src={logoTeamPB} 
            alt="TEAM PB Logo" 
            className="h-[120px] md:h-[144px] w-auto object-contain"
          />
        </div>
        
        {/* Glow effect container */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/20 via-transparent to-red-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-20 pointer-events-none"></div>
        
        <form 
          onSubmit={handleSubmit}
          className="relative backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10 hover:border-white/20 transition-all duration-300"
        >
          {/* Gradient overlay layers */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none -z-10"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent to-red-600/5 pointer-events-none -z-10"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2 tracking-tight">
              CONSULTORIA
            </h1>
            <p className="text-xs text-white/60 text-center mb-8 uppercase tracking-wider">Acesso ao Sistema</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-white/90 mb-2 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  className="w-full p-4 rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm 
                             text-white placeholder:text-white/40
                             focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 
                             transition-all duration-200 outline-none
                             hover:border-white/20 hover:bg-black/40"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/90 mb-2 uppercase tracking-wide">Senha</label>
                <input
                  type="password"
                  className="w-full p-4 rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm 
                             text-white placeholder:text-white/40
                             focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 
                             transition-all duration-200 outline-none
                             hover:border-white/20 hover:bg-black/40"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full p-4 mt-8 rounded-lg text-white font-bold text-lg uppercase tracking-wide
                           bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
                           shadow-lg shadow-red-600/30 hover:shadow-red-600/50
                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                           transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Acessando...
                  </span>
                ) : (
                  "Acessar"
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-600/20 border border-red-600/50 backdrop-blur-sm">
                  <p className="text-sm text-red-300 font-medium text-center">{error}</p>
                </div>
              )}
            </div>
          </div>
        </form>
        
        {/* Botão Voltar */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl font-bold text-white backdrop-blur-md bg-white/10 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span>&lt;</span>
            <span>Voltar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultoriaLogin;


