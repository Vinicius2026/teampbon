import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MensagemSuporte = {
  id: string;
  mensagem_usuario: string;
  mensagem_usuario_enviada_em: string;
  resposta_admin: string | null;
  resposta_admin_enviada_por_email: string | null;
  resposta_admin_enviada_em: string | null;
  lido_pelo_usuario: boolean;
  lido_pelo_usuario_em: string | null;
  created_at: string;
};

const Suporte = () => {
  const [mensagens, setMensagens] = useState<MensagemSuporte[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadMensagens();
    // Carregar mensagens a cada 30 segundos para verificar novas respostas
    const interval = setInterval(loadMensagens, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMensagens = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      const { data, error } = await supabase.rpc("buscar_suporte_usuario", {
        p_user_id: session.session.user.id,
      });

      if (error) {
        console.error("Erro ao carregar mensagens:", error);
        return;
      }

      setMensagens(data || []);

      // Marcar automaticamente como lido se houver resposta nova não lida
      const mensagensComRespostaNaoLida = (data || []).filter(
        (m) => m.resposta_admin && !m.lido_pelo_usuario
      );

      for (const mensagem of mensagensComRespostaNaoLida) {
        await marcarComoLida(mensagem.id);
      }
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) {
      alert("Por favor, digite uma mensagem.");
      return;
    }

    try {
      setEnviando(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      const { error } = await supabase.from("suporte").insert([
        {
          user_id: session.session.user.id,
          user_email: session.session.user.email || null,
          mensagem_usuario: novaMensagem.trim(),
        },
      ]);

      if (error) {
        throw error;
      }

      setNovaMensagem("");
      await loadMensagens();
      alert("Mensagem enviada com sucesso! O administrador responderá em breve.");
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      alert("Erro ao enviar mensagem: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const marcarComoLida = async (mensagemId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      await supabase.rpc("marcar_resposta_suporte_lida", {
        p_suporte_id: mensagemId,
        p_user_id: session.session.user.id,
      });

      await loadMensagens();
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-3 text-white tracking-tight">
          Suporte
        </h1>
        <p className="text-white/60 text-sm md:text-base">
          Envie sua mensagem e nossa equipe responderá o mais breve possível
        </p>
      </div>

      {/* Formulário para enviar nova mensagem */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-black mb-4 text-white uppercase tracking-wide">Enviar Mensagem</h2>
        <textarea
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="Descreva sua dúvida ou problema..."
          rows={6}
          className="w-full p-3.5 rounded-xl border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all mb-4 resize-none"
        />
        <button
          onClick={enviarMensagem}
          disabled={enviando || !novaMensagem.trim()}
          className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 transform hover:scale-105 disabled:hover:scale-100"
        >
          {enviando ? "Enviando..." : "Enviar Mensagem"}
        </button>
      </div>

      {/* Histórico de mensagens */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-black mb-4 text-white uppercase tracking-wide">Histórico de Mensagens</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white/70">Carregando mensagens...</p>
          </div>
        ) : mensagens.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/70">Nenhuma mensagem enviada ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mensagens.map((mensagem) => {
              const isExpanded = expandedId === mensagem.id;
              const temResposta = mensagem.resposta_admin && mensagem.resposta_admin.trim() !== "";
              const naoLida = temResposta && !mensagem.lido_pelo_usuario;

              return (
                <div
                  key={mensagem.id}
                  className={`bg-black border-2 rounded-xl overflow-hidden ${
                    naoLida
                      ? "border-red-600/50 bg-red-600/10"
                      : "border-white/10"
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : mensagem.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          naoLida ? "bg-red-400" : "bg-white/20"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-white">
                            {new Date(mensagem.mensagem_usuario_enviada_em).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          {temResposta ? (
                            mensagem.lido_pelo_usuario ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-900/50 text-emerald-400 border border-emerald-700">
                                ✓ Respondido
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-600/20 text-red-400 border border-red-700">
                                Nova Resposta
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-yellow-900/50 text-yellow-400 border border-yellow-700">
                              Aguardando resposta
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70 line-clamp-2">
                          {mensagem.mensagem_usuario}
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-white/70 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
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

                  {isExpanded && (
                    <div className="border-t border-white/10 bg-white/5/50 p-4 space-y-4">
                      {/* Mensagem do usuário */}
                      <div>
                        <h4 className="text-sm font-black text-white/70 mb-2">
                          Sua mensagem:
                        </h4>
                        <p className="text-white whitespace-pre-wrap">{mensagem.mensagem_usuario}</p>
                        <p className="text-xs text-white/50 mt-2">
                          Enviada em:{" "}
                          {new Date(mensagem.mensagem_usuario_enviada_em).toLocaleString("pt-BR")}
                        </p>
                      </div>

                      {/* Resposta do admin */}
                      {temResposta ? (
                        <div className="border-t border-white/10 pt-4">
                          <h4 className="text-sm font-black text-red-400 mb-2">
                            Resposta do Expert:
                          </h4>
                          <p className="text-white whitespace-pre-wrap">{mensagem.resposta_admin}</p>
                          <p className="text-xs text-white/50 mt-2">
                            Respondido em:{" "}
                            {mensagem.resposta_admin_enviada_em &&
                              new Date(mensagem.resposta_admin_enviada_em).toLocaleString("pt-BR")}
                          </p>
                          {naoLida && (
                            <button
                              onClick={() => marcarComoLida(mensagem.id)}
                              className="mt-3 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm transition-all"
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="border-t border-white/10 pt-4">
                          <p className="text-white/70 text-sm">
                            ⏳ Aguardando resposta do administrador...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Suporte;

