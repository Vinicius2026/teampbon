import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id: number;
  email: string | null;
  nome_completo: string | null;
  objetivo: string | null;
  plano_contratado: string | null;
  status: string | null;
  created_at: string | null;
  user_id?: string | null;
  form_preenchido?: boolean | null;
  dias_acesso?: number | null;
  dias_adicionais?: number | null;
  data_expiracao?: string | null;
  acesso_bloqueado?: boolean | null;
  tem_progresso_pendente?: boolean | null;
  tem_suporte?: boolean | null;
};

const DEFAULT_PASSWORD = "teampb2025";

const CreateUserForm = ({ onUserCreated }: { onUserCreated: () => void }) => {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [diasAcesso, setDiasAcesso] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!nomeCompleto.trim()) {
      setError("Por favor, informe o nome completo do usuário");
      setLoading(false);
      return;
    }

    try {
      // Chamar Edge Function para criar usuário
      const { data: fnData, error: fnError } = await supabase.functions.invoke("create-user", {
        body: {
          email: email,
          password: DEFAULT_PASSWORD,
          nome_completo: nomeCompleto.trim(),
          dias_acesso: diasAcesso,
          app_metadata: { role: "consultoria" },
        },
      });

      if (fnError) throw fnError;
      
      if (fnData?.userId) {
        setSuccess(`Usuário criado com sucesso! Email: ${email} / Senha: ${DEFAULT_PASSWORD} / Acesso: ${diasAcesso} dias`);
        setNomeCompleto("");
        setEmail("");
        setDiasAcesso(30);
        onUserCreated();
      } else {
        throw new Error("Usuário criado mas sem retorno de ID");
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 mb-6">
      <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wide">Criar Novo Usuário</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-black text-white/90 mb-2 uppercase tracking-wide">Nome Completo</label>
          <input
            type="text"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all"
            placeholder="Primeiro e Sobrenome"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-black text-white/90 mb-2 uppercase tracking-wide">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all"
            placeholder="usuario@email.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-black text-white/90 mb-3 uppercase tracking-wide">Dias de Acesso</label>
          <div className="flex gap-6">
            <label className="inline-flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="dias_acesso"
                value="30"
                checked={diasAcesso === 30}
                onChange={(e) => setDiasAcesso(30)}
                className="w-5 h-5 text-red-600 border-white/20 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-black cursor-pointer"
              />
              <span className="text-white font-medium group-hover:text-red-400 transition-colors">30 dias</span>
            </label>
            <label className="inline-flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="dias_acesso"
                value="90"
                checked={diasAcesso === 90}
                onChange={(e) => setDiasAcesso(90)}
                className="w-5 h-5 text-red-600 border-white/20 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-black cursor-pointer"
              />
              <span className="text-white font-medium group-hover:text-red-400 transition-colors">90 dias</span>
            </label>
          </div>
          <p className="text-xs text-white/50 mt-3">
            O usuário terá acesso ao sistema por {diasAcesso} dias a partir da data de criação.
          </p>
        </div>
        <div>
          <p className="text-xs text-white/50 mb-2">
            Senha padrão: <span className="font-mono font-black text-white">{DEFAULT_PASSWORD}</span>
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 transform hover:scale-105 disabled:hover:scale-100"
        >
          {loading ? "Criando..." : "Criar Usuário"}
        </button>
        {error && (
          <div className="text-sm text-red-400 bg-red-600/10 border border-red-600/30 rounded-xl p-4">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-white bg-white/10 border border-white/20 rounded-xl p-4">
            {success}
          </div>
        )}
      </form>
    </div>
  );
};

const Dashboard = () => {
  const location = useLocation();
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadUsers = async () => {
    setLoading(true);
    
    try {
      console.log("[Dashboard] Carregando usuários...");
      
      // Buscar TODOS os usuários (sem filtrar por status)
      const { data: allUsers, error: errUsers } = await supabase
        .from("consultoria_cadastros")
        .select("id, email, nome_completo, objetivo, plano_contratado, status, created_at, user_id, form_preenchido, dias_acesso, dias_adicionais, data_expiracao, acesso_bloqueado")
        .order("id", { ascending: false })
        .limit(100);

      if (errUsers) {
        console.error("[Dashboard] Error loading users:", errUsers);
        return;
      }

      console.log("[Dashboard] Total de usuários encontrados:", allUsers?.length || 0);

      // Verificar quais usuários têm acompanhamentos não visualizados
      const usuariosComProgresso = await verificarProgressoPendente(allUsers || []);

      // Verificar quais usuários têm solicitações de suporte
      const usuariosComSuporte = await verificarSuporte(usuariosComProgresso);

      console.log("[Dashboard] Usuários processados:", usuariosComSuporte.length);

      setUsers(usuariosComSuporte);
    } catch (err) {
      console.error("[Dashboard] Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const verificarProgressoPendente = async (usuarios: Row[]): Promise<Row[]> => {
    const usuariosComUserId = usuarios.filter(u => u.user_id);
    
    if (usuariosComUserId.length === 0) return usuarios;

    try {
      // Buscar todos os acompanhamentos não visualizados
      const { data: acompanhamentos, error } = await supabase
        .from("acompanhamento_semanal")
        .select("user_id")
        .eq("admin_visualizado", false)
        .not("formulario_numero", "is", null);

      if (error) {
        console.error("Erro ao verificar progresso pendente:", error);
        return usuarios;
      }

      // Criar set de user_ids com progresso pendente
      const userIdsComProgresso = new Set(
        (acompanhamentos || []).map(a => a.user_id)
      );

      // Adicionar flag tem_progresso_pendente aos usuários
      return usuarios.map(u => ({
        ...u,
        tem_progresso_pendente: u.user_id ? userIdsComProgresso.has(u.user_id) : false,
      }));
    } catch (err) {
      console.error("Erro ao verificar progresso:", err);
      return usuarios;
    }
  };

  const verificarSuporte = async (usuarios: Row[]): Promise<Row[]> => {
    const usuariosComUserId = usuarios.filter(u => u.user_id);
    
    if (usuariosComUserId.length === 0) return usuarios;

    try {
      // Buscar todos os usuários com solicitações de suporte
      const { data: suportes, error } = await supabase
        .from("suporte")
        .select("user_id")
        .not("mensagem_usuario", "is", null);

      if (error) {
        console.error("Erro ao verificar suporte:", error);
        return usuarios;
      }

      // Criar set de user_ids com suporte
      const userIdsComSuporte = new Set(
        (suportes || []).map(s => s.user_id)
      );

      // Adicionar flag tem_suporte aos usuários
      return usuarios.map(u => ({
        ...u,
        tem_suporte: u.user_id ? userIdsComSuporte.has(u.user_id) : false,
      }));
    } catch (err) {
      console.error("Erro ao verificar suporte:", err);
      return usuarios;
    }
  };

  useEffect(() => {
    loadUsers();
  }, [refreshKey]);

  // Recarregar quando voltar para o Dashboard (detecta mudança de rota)
  useEffect(() => {
    // Quando a rota é /adminseven (Dashboard), recarregar dados
    if (location.pathname === "/adminseven") {
      setRefreshKey((k) => k + 1);
    }
  }, [location.pathname]);

  // Recarregar quando a página receber foco (útil quando volta do UserDetail)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey((k) => k + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black mb-3 text-white tracking-tight">Dashboard</h1>
        <p className="text-white/60 text-sm md:text-base">Visão geral do sistema.</p>
      </div>

      <CreateUserForm onUserCreated={() => setRefreshKey((k) => k + 1)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-white/70 text-sm">Total de Usuários</div>
          <div className="text-3xl font-black">{users.length}</div>
        </div>
      </div>

      <section>
        <h2 className="text-xl md:text-2xl font-black mb-4 text-white uppercase tracking-wide">Usuários</h2>
        {loading ? (
          <div className="text-white/70">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="text-white/70">Nenhum usuário cadastrado.</div>
        ) : (
          <ul className="space-y-2">
            {users.map((u) => (
              <li key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black text-white">{u.nome_completo || u.email || "Nome não informado"}</span>
                    {u.plano_contratado && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-400">
                        {u.plano_contratado}
                      </span>
                    )}
                    {u.tem_progresso_pendente && (
                      <span className="text-xs px-3 py-1 rounded-full bg-yellow-900/50 text-yellow-400 border border-yellow-700 font-black animate-pulse">
                        📊 Progresso (Visualize)
                      </span>
                    )}
                    {u.tem_suporte && (
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-900/50 text-blue-400 border border-blue-700 font-black">
                        🆘 Suporte
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white/70">{u.email || "sem e-mail"}</div>
                  {u.user_id && (
                    <div className="text-xs">
                      {u.form_preenchido === false || u.form_preenchido === null 
                        ? <span className="text-yellow-400">⚠️ Usuário ainda não completou formulário</span>
                        : <span className="text-emerald-400">✅ Formulário completado</span>}
                    </div>
                  )}
                  {u.user_id && u.data_expiracao && (
                    <div className="text-xs">
                      {new Date(u.data_expiracao) < new Date() 
                        ? <span className="text-red-400">⏱️ Acesso expirado em {new Date(u.data_expiracao).toLocaleDateString('pt-BR')}</span>
                        : <span className="text-white/70">📅 Expira em {new Date(u.data_expiracao).toLocaleDateString('pt-BR')} ({Math.ceil((new Date(u.data_expiracao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes)</span>}
                      {u.acesso_bloqueado && <span className="text-red-400 ml-2">🚫 Bloqueado</span>}
                    </div>
                  )}
                  <div className="text-sm text-white/50">{u.objetivo || "Objetivo não informado"}</div>
                  {u.created_at && (
                    <div className="text-xs text-white/40">
                      Cadastrado em {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
                <Link to={`/adminseven/user/${u.id}`} className="text-sm px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition-colors">
                  Ver
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;


