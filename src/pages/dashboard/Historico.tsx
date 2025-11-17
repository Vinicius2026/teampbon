import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Acompanhamento = {
  id: string;
  semana_inicio: string;
  semana_fim: string;
  hidratacao: string;
  treino_dias: Record<string, string>;
  exercicios_realizados: string[];
  horas_sono: string;
  peso_atual: number;
  desafios_conquistas: string;
  created_at: string;
};

const Historico = () => {
  const [registros, setRegistros] = useState<Acompanhamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistorico();
  }, []);

  const loadHistorico = async () => {
    const { data, error } = await supabase
      .from("acompanhamento_semanal")
      .select("*")
      .order("semana_inicio", { ascending: false });

    if (!error && data) {
      setRegistros(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center">Carregando histórico...</div>;
  }

  if (registros.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Histórico de Acompanhamento</h1>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-zinc-400">
          <p>Você ainda não tem registros de acompanhamento.</p>
          <p className="mt-2">Complete o formulário semanal para começar seu histórico!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-6">Histórico de Acompanhamento</h1>

      <div className="space-y-4">
        {registros.map((registro) => {
          const isExpanded = expandedId === registro.id;
          const dataInicio = new Date(registro.semana_inicio).toLocaleDateString("pt-BR");
          const dataFim = new Date(registro.semana_fim).toLocaleDateString("pt-BR");

          return (
            <div key={registro.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : registro.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-lg text-purple-400">
                    Semana de {dataInicio} a {dataFim}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Enviado em {new Date(registro.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <span className="text-2xl text-zinc-400">{isExpanded ? "−" : "+"}</span>
              </button>

              {/* Content */}
              {isExpanded && (
                <div className="p-6 border-t border-zinc-800 space-y-6">
                  {/* Hidratação */}
                  <div>
                    <h4 className="font-semibold text-purple-400 mb-2">Hidratação</h4>
                    <p className="text-white">{registro.hidratacao} diariamente</p>
                  </div>

                  {/* Treino por dia */}
                  {registro.treino_dias && Object.keys(registro.treino_dias).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-purple-400 mb-2">Treino por dia</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(registro.treino_dias).map(([dia, perc]) => (
                          <div key={dia} className="bg-zinc-800 p-2 rounded">
                            <span className="text-sm font-semibold text-zinc-300">{dia}:</span>{" "}
                            <span className="text-sm text-white">{perc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exercícios */}
                  {registro.exercicios_realizados && registro.exercicios_realizados.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-purple-400 mb-2">
                        Exercícios realizados ({registro.exercicios_realizados.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {registro.exercicios_realizados.map((ex, idx) => (
                          <div key={idx} className="text-sm text-zinc-300 bg-zinc-800 p-2 rounded">
                            • {ex}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sono */}
                  <div>
                    <h4 className="font-semibold text-purple-400 mb-2">Sono</h4>
                    <p className="text-white">{registro.horas_sono} por dia em média</p>
                  </div>

                  {/* Peso */}
                  {registro.peso_atual && (
                    <div>
                      <h4 className="font-semibold text-purple-400 mb-2">Peso</h4>
                      <p className="text-white">{registro.peso_atual} kg</p>
                    </div>
                  )}

                  {/* Desafios */}
                  {registro.desafios_conquistas && (
                    <div>
                      <h4 className="font-semibold text-purple-400 mb-2">Desafios e conquistas</h4>
                      <p className="text-white whitespace-pre-wrap">{registro.desafios_conquistas}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Historico;

