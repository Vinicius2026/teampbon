import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Treino = {
  id: string;
  explicacao_repeticoes: string | null;
  explicacao_series: string | null;
  tempo_descanso: string | null;
  progressao_carga: string | null;
  treino_a_dia: string | null;
  treino_a_tipo: string | null;
  treino_a_exercicios: Array<{ exercicio: string; serie: string }> | null;
  treino_b_dia: string | null;
  treino_b_tipo: string | null;
  treino_b_exercicios: Array<{ exercicio: string; serie: string }> | null;
  treino_c_dia: string | null;
  treino_c_tipo: string | null;
  treino_c_exercicios: Array<{ exercicio: string; serie: string }> | null;
  treino_d_dia: string | null;
  treino_d_tipo: string | null;
  treino_d_exercicios: Array<{ exercicio: string; serie: string }> | null;
  treino_e_dia: string | null;
  treino_e_tipo: string | null;
  treino_e_exercicios: Array<{ exercicio: string; serie: string }> | null;
  enviado_em: string;
  created_at: string;
};

const Treino = () => {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: session, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Erro ao obter sessão:", error);
          setUserId(null);
          return;
        }
        if (session.session?.user?.id) {
          setUserId(session.session.user.id);
        } else {
          setUserId(null);
        }
      } catch (err) {
        console.error("Erro ao obter userId:", err);
        setUserId(null);
      }
    };
    getUserId();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userId) {
      loadTreinos();
    }
  }, [userId]);

  const loadTreinos = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("treinos")
        .select("*")
        .eq("user_id", userId)
        .order("enviado_em", { ascending: false });

      if (error) {
        console.error("Erro ao carregar treinos:", error);
        return;
      }

      setTreinos(data || []);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 relative">
          <h1 className="text-3xl md:text-4xl font-black mb-2 text-red-600 uppercase tracking-tight leading-tight">
            TREINO
          </h1>
          <div className="absolute top-full left-0 w-full transform scale-y-[-1] opacity-20 blur-[1px]">
            <h1 className="text-3xl md:text-4xl font-black text-red-900/30 uppercase tracking-tight leading-tight">
              TREINO
            </h1>
          </div>
          <div className="h-0.5 w-20 bg-red-600 mt-3"></div>
        </div>
        <div className="relative bg-black/40 border border-red-600/30 rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-sm font-medium">Carregando seus treinos...</p>
        </div>
      </div>
    );
  }

  if (treinos.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 relative">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 uppercase tracking-tight leading-tight">
            TREINO
          </h1>
          <div className="absolute inset-0 text-4xl md:text-5xl lg:text-6xl font-black text-red-900/30 blur-sm uppercase tracking-tight leading-tight transform translate-y-1">
            TREINO
          </div>
        </div>
        <div className="relative bg-black/40 border border-red-600/30 rounded-lg p-8 text-center">
          <p className="text-white/80 text-base font-semibold mb-2 text-red-600">
            Nenhum treino disponível ainda
          </p>
          <p className="text-white/50 text-sm">
            Seu treino personalizado será enviado em breve pelo administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Título com efeito espelho vermelho minimalista */}
      <div className="mb-6 relative">
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-black mb-2 text-red-600 uppercase tracking-tight leading-tight">
            TREINO
          </h1>
          {/* Efeito espelho/reflexo vermelho */}
          <div className="absolute top-full left-0 w-full transform scale-y-[-1] opacity-20 blur-[1px]">
            <h1 className="text-3xl md:text-4xl font-black text-red-900/30 uppercase tracking-tight leading-tight">
              TREINO
            </h1>
          </div>
        </div>
        <div className="h-0.5 w-20 bg-red-600 mt-3"></div>
      </div>
      
      <div className="space-y-5">
        {treinos.map((treino) => (
          <div
            key={treino.id}
            className="relative bg-black/40 border border-red-600/30 rounded-lg p-4 md:p-5 overflow-hidden"
          >
            <div className="relative z-10">
              {/* Cabeçalho com data */}
              <div className="mb-4 pb-3 border-b border-red-600/20">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Enviado em</p>
                <p className="text-sm text-red-600 font-semibold">
                  {new Date(treino.enviado_em).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

            {/* Lista vertical com todas as informações - cada uma ocupa toda a largura */}
            <div className="space-y-3">
              {treino.explicacao_repeticoes && (
                <div className="border-l-2 border-red-600 pl-3 py-2">
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">
                    Explicação sobre o número de repetições
                  </h3>
                  <div className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                    {treino.explicacao_repeticoes}
                  </div>
                </div>
              )}

              {treino.explicacao_series && (
                <div className="border-l-2 border-red-600 pl-3 py-2">
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">
                    Explicação sobre as séries
                  </h3>
                  <div className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                    {treino.explicacao_series}
                  </div>
                </div>
              )}

              {treino.tempo_descanso && (
                <div className="border-l-2 border-red-600 pl-3 py-2">
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">
                    Tempo de descanso
                  </h3>
                  <div className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                    {treino.tempo_descanso}
                  </div>
                </div>
              )}

              {treino.progressao_carga && (
                <div className="border-l-2 border-red-600 pl-3 py-2">
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">
                    Progressão de carga
                  </h3>
                  <div className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                    {treino.progressao_carga}
                  </div>
                </div>
              )}

              {treino.treino_a_exercicios && Array.isArray(treino.treino_a_exercicios) && treino.treino_a_exercicios.length > 0 && (
                <div className="border border-red-600/30 rounded-lg p-3 mt-3">
                  <div className="mb-3 pb-2 border-b border-red-600/20">
                    <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide">
                      Treino A: {treino.treino_a_dia || "Segunda-feira"} <span className="text-white/60 font-normal">({treino.treino_a_tipo || "Push"})</span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {treino.treino_a_exercicios.map((ex: any, idx: number) => (
                      ex.exercicio && (
                        <div key={idx} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-b-0">
                          <span className="text-xs text-red-600 font-bold mt-0.5 min-w-[20px]">{idx + 1}.</span>
                          <div className="flex-1">
                            <span className="text-sm text-white font-medium">{ex.exercicio}</span>
                            {ex.serie && (
                              <>
                                <span className="text-white/40 mx-1.5">/</span>
                                <span className="text-sm text-red-600 font-medium">{ex.serie}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {treino.treino_b_exercicios && Array.isArray(treino.treino_b_exercicios) && treino.treino_b_exercicios.length > 0 && (
                <div className="border border-red-600/30 rounded-lg p-3 mt-3">
                  <div className="mb-3 pb-2 border-b border-red-600/20">
                    <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide">
                      Treino B: {treino.treino_b_dia || "Terça-feira"} <span className="text-white/60 font-normal">({treino.treino_b_tipo || "Push"})</span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {treino.treino_b_exercicios.map((ex: any, idx: number) => (
                      ex.exercicio && (
                        <div key={idx} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-b-0">
                          <span className="text-xs text-red-600 font-bold mt-0.5 min-w-[20px]">{idx + 1}.</span>
                          <div className="flex-1">
                            <span className="text-sm text-white font-medium">{ex.exercicio}</span>
                            {ex.serie && (
                              <>
                                <span className="text-white/40 mx-1.5">/</span>
                                <span className="text-sm text-red-600 font-medium">{ex.serie}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {treino.treino_c_exercicios && Array.isArray(treino.treino_c_exercicios) && treino.treino_c_exercicios.length > 0 && (
                <div className="border border-red-600/30 rounded-lg p-3 mt-3">
                  <div className="mb-3 pb-2 border-b border-red-600/20">
                    <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide">
                      Treino C: {treino.treino_c_dia || "Quarta-feira"} <span className="text-white/60 font-normal">({treino.treino_c_tipo || "Push"})</span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {treino.treino_c_exercicios.map((ex: any, idx: number) => (
                      ex.exercicio && (
                        <div key={idx} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-b-0">
                          <span className="text-xs text-red-600 font-bold mt-0.5 min-w-[20px]">{idx + 1}.</span>
                          <div className="flex-1">
                            <span className="text-sm text-white font-medium">{ex.exercicio}</span>
                            {ex.serie && (
                              <>
                                <span className="text-white/40 mx-1.5">/</span>
                                <span className="text-sm text-red-600 font-medium">{ex.serie}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {treino.treino_d_exercicios && Array.isArray(treino.treino_d_exercicios) && treino.treino_d_exercicios.length > 0 && (
                <div className="border border-red-600/30 rounded-lg p-3 mt-3">
                  <div className="mb-3 pb-2 border-b border-red-600/20">
                    <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide">
                      Treino D: {treino.treino_d_dia || "Sexta-feira"} <span className="text-white/60 font-normal">({treino.treino_d_tipo || "Push"})</span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {treino.treino_d_exercicios.map((ex: any, idx: number) => (
                      ex.exercicio && (
                        <div key={idx} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-b-0">
                          <span className="text-xs text-red-600 font-bold mt-0.5 min-w-[20px]">{idx + 1}.</span>
                          <div className="flex-1">
                            <span className="text-sm text-white font-medium">{ex.exercicio}</span>
                            {ex.serie && (
                              <>
                                <span className="text-white/40 mx-1.5">/</span>
                                <span className="text-sm text-red-600 font-medium">{ex.serie}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {treino.treino_e_exercicios && Array.isArray(treino.treino_e_exercicios) && treino.treino_e_exercicios.length > 0 && (
                <div className="border border-red-600/30 rounded-lg p-3 mt-3">
                  <div className="mb-3 pb-2 border-b border-red-600/20">
                    <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide">
                      Treino E: {treino.treino_e_dia || "Sábado"} <span className="text-white/60 font-normal">({treino.treino_e_tipo || "Push"})</span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {treino.treino_e_exercicios.map((ex: any, idx: number) => (
                      ex.exercicio && (
                        <div key={idx} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-b-0">
                          <span className="text-xs text-red-600 font-bold mt-0.5 min-w-[20px]">{idx + 1}.</span>
                          <div className="flex-1">
                            <span className="text-sm text-white font-medium">{ex.exercicio}</span>
                            {ex.serie && (
                              <>
                                <span className="text-white/40 mx-1.5">/</span>
                                <span className="text-sm text-red-600 font-medium">{ex.serie}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Treino;

