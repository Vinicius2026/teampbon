import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há mensagem de erro passada via location.state
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      // Limpar o state para evitar mostrar a mensagem novamente ao recarregar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
        throw authError;
      }

      if (!data?.session) {
        setError("Falha ao autenticar. Tente novamente.");
        setLoading(false);
        return;
      }

      // Verificar role no app_metadata
      const role = data.session.user?.app_metadata?.role;
      
      if (role !== "admin") {
        // Fazer logout se não for admin
        await supabase.auth.signOut();
        setError("Este acesso é restrito a administradores e experts do sistema.");
        setLoading(false);
        return;
      }

      // Se chegou aqui, é admin - redirecionar
      navigate("/adminseven");
    } catch (err: any) {
      // Verificar se é erro de credenciais inválidas
      if (err?.message?.includes("Invalid login credentials") || err?.message?.includes("Email not confirmed")) {
        setError("Email ou senha inválidos.");
      } else {
        setError(err?.message || "Falha ao acessar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]"></div>
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="w-full max-w-md relative z-10 group">
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
              ADMIN
            </h1>
            <p className="text-xs text-white/60 text-center mb-8 uppercase tracking-wider">Painel Administrativo</p>
            
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
                  placeholder="admin@email.com"
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
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
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
      </div>
    </div>
  );
};

export default AdminLogin;


