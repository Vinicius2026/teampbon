import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MensagemSuporte = {
  id: string;
  nome: string;
  email: string;
  celular: string | null;
  mensagem: string;
  status: "pending" | "read" | "resolved";
  created_at: string;
  read_at: string | null;
  read_by: string | null;
};

const SuporteVisitantes = () => {
  const [mensagens, setMensagens] = useState<MensagemSuporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "read" | "resolved">("all");

  useEffect(() => {
    loadMensagens();
  }, [filterStatus]);

  const loadMensagens = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("suporte_visitantes")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar mensagens:", error);
        return;
      }

      setMensagens(data || []);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      const { error } = await supabase
        .from("suporte_visitantes")
        .update({
          status: "read",
          read_at: new Date().toISOString(),
          read_by: session.session.user.id,
        })
        .eq("id", id);

      if (error) {
        console.error("Erro ao marcar como lida:", error);
        return;
      }

      await loadMensagens();
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  const marcarComoResolvida = async (id: string) => {
    try {
      const { error } = await supabase
        .from("suporte_visitantes")
        .update({ status: "resolved" })
        .eq("id", id);

      if (error) {
        console.error("Erro ao marcar como resolvida:", error);
        return;
      }

      await loadMensagens();
    } catch (err) {
      console.error("Erro ao marcar como resolvida:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-600 text-white">
            🔔 Pendente
          </span>
        );
      case "read":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
            👁️ Lida
          </span>
        );
      case "resolved":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white">
            ✅ Resolvida
          </span>
        );
      default:
        return null;
    }
  };

  const pendingCount = mensagens.filter((m) => m.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Suporte Visitantes</h1>
          <p className="text-white/60 mt-1">
            Gerencie as mensagens de suporte enviadas pelos visitantes
          </p>
        </div>
        
        {pendingCount > 0 && (
          <div className="px-4 py-2 rounded-xl bg-yellow-600/20 border border-yellow-600/50">
            <p className="text-yellow-400 font-bold">
              {pendingCount} {pendingCount === 1 ? "mensagem pendente" : "mensagens pendentes"}
            </p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            filterStatus === "all"
              ? "bg-white text-black"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Todas ({mensagens.length})
        </button>
        <button
          onClick={() => setFilterStatus("pending")}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            filterStatus === "pending"
              ? "bg-yellow-600 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilterStatus("read")}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            filterStatus === "read"
              ? "bg-blue-600 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Lidas
        </button>
        <button
          onClick={() => setFilterStatus("resolved")}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            filterStatus === "resolved"
              ? "bg-green-600 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Resolvidas
        </button>
      </div>

      {/* Lista de Mensagens */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 mt-4">Carregando mensagens...</p>
        </div>
      ) : mensagens.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <p className="text-white/70 text-lg">Nenhuma mensagem encontrada.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mensagens.map((msg) => (
            <div
              key={msg.id}
              className={`bg-white/5 border-2 rounded-xl overflow-hidden transition-all ${
                msg.status === "pending"
                  ? "border-yellow-600/50"
                  : msg.status === "read"
                  ? "border-blue-600/30"
                  : "border-green-600/30"
              }`}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{msg.nome}</h3>
                    {getStatusBadge(msg.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/60 flex-wrap">
                    <span>📧 {msg.email}</span>
                    {msg.celular && <span>📱 {msg.celular}</span>}
                    <span>
                      🕐 {new Date(msg.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
                <svg
                  className={`w-6 h-6 text-white/60 transition-transform ${
                    expandedId === msg.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Content */}
              {expandedId === msg.id && (
                <div className="border-t border-white/10 p-4 md:p-6 space-y-4">
                  <div className="bg-black/30 rounded-xl p-4">
                    <h4 className="text-white font-bold mb-2">Mensagem:</h4>
                    <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                      {msg.mensagem}
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      {msg.mensagem.length} caracteres
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3 flex-wrap">
                    {msg.status === "pending" && (
                      <button
                        onClick={() => marcarComoLida(msg.id)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all"
                      >
                        Marcar como Lida
                      </button>
                    )}
                    {msg.status !== "resolved" && (
                      <button
                        onClick={() => marcarComoResolvida(msg.id)}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all"
                      >
                        Marcar como Resolvida
                      </button>
                    )}
                    <a
                      href={`mailto:${msg.email}`}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                    >
                      Responder por E-mail
                    </a>
                    {msg.celular && (
                      <a
                        href={`https://wa.me/${msg.celular.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>

                  {msg.read_at && (
                    <p className="text-white/40 text-xs">
                      Lida em: {new Date(msg.read_at).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuporteVisitantes;
