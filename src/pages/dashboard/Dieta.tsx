import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Dieta = {
  id: string;
  liquido: string | null;
  refeicao_1_acordar: string | null;
  refeicao_2_almoco: string | null;
  refeicao_3_lanche_tarde: string | null;
  refeicao_4_janta: string | null;
  enviado_em: string;
  created_at: string;
};

const Dieta = () => {
  const [dietas, setDietas] = useState<Dieta[]>([]);
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
      loadDietas();
    }
  }, [userId]);

  const loadDietas = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dietas")
        .select("*")
        .eq("user_id", userId)
        .order("enviado_em", { ascending: false });

      if (error) {
        console.error("Erro ao carregar dietas:", error);
        return;
      }

      setDietas(data || []);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-black mb-6 text-white uppercase tracking-wide">Dieta</h1>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Carregando suas dietas...</p>
        </div>
      </div>
    );
  }

  if (dietas.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-black mb-6 text-white uppercase tracking-wide">Dieta</h1>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-white/70 text-lg font-bold mb-2">
            Nenhuma dieta disponível ainda
          </p>
          <p className="text-white/50 text-sm">
            Sua dieta personalizada será enviada em breve pelo administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-black mb-6 text-white uppercase tracking-wide">Dieta</h1>
      
      <div className="space-y-6">
        {dietas.map((dieta) => (
          <div
            key={dieta.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6"
          >
            {/* Cabeçalho com data */}
            <div className="mb-4 pb-4 border-b border-white/10">
              <p className="text-xs md:text-sm text-white/50 font-bold">
                📅 Enviada em {new Date(dieta.enviado_em).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Lista vertical com as refeições - cada uma ocupa toda a largura */}
            <div className="space-y-4">
              {dieta.liquido && (
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 md:p-5 w-full">
                  <h3 className="text-base md:text-lg font-black text-red-400 mb-3 uppercase tracking-wide">
                    💧 Líquido
                  </h3>
                  <div className="text-sm md:text-base text-white/90 whitespace-pre-line leading-relaxed">
                    {dieta.liquido}
                  </div>
                </div>
              )}

              {dieta.refeicao_1_acordar && (
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 md:p-5 w-full">
                  <h3 className="text-base md:text-lg font-black text-red-400 mb-3 uppercase tracking-wide">
                    🌅 Refeição 1 - Ao Acordar
                  </h3>
                  <div className="text-sm md:text-base text-white/90 whitespace-pre-line leading-relaxed">
                    {dieta.refeicao_1_acordar}
                  </div>
                </div>
              )}

              {dieta.refeicao_2_almoco && (
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 md:p-5 w-full">
                  <h3 className="text-base md:text-lg font-black text-red-400 mb-3 uppercase tracking-wide">
                    🍽️ Refeição 2 - Almoço
                  </h3>
                  <div className="text-sm md:text-base text-white/90 whitespace-pre-line leading-relaxed">
                    {dieta.refeicao_2_almoco}
                  </div>
                </div>
              )}

              {dieta.refeicao_3_lanche_tarde && (
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 md:p-5 w-full">
                  <h3 className="text-base md:text-lg font-black text-red-400 mb-3 uppercase tracking-wide">
                    ☕ Refeição 3 - Lanche da Tarde
                  </h3>
                  <div className="text-sm md:text-base text-white/90 whitespace-pre-line leading-relaxed">
                    {dieta.refeicao_3_lanche_tarde}
                  </div>
                </div>
              )}

              {dieta.refeicao_4_janta && (
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 md:p-5 w-full">
                  <h3 className="text-base md:text-lg font-black text-red-400 mb-3 uppercase tracking-wide">
                    🌙 Refeição 4 - Janta
                  </h3>
                  <div className="text-sm md:text-base text-white/90 whitespace-pre-line leading-relaxed">
                    {dieta.refeicao_4_janta}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dieta;

