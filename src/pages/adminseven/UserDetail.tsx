import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import ProgressCharts from "@/components/ProgressCharts";
import { ExercicioAutocomplete } from "@/components/ExercicioAutocomplete";
import { DiaTreinoForm } from "@/components/DiaTreinoForm";

const DEFAULT_PASSWORD = "teampb11221122";

// Componente para exibir acompanhamentos do usuário
const AcompanhamentosSection = ({ userId, onConfirmacaoChange }: { userId: string; onConfirmacaoChange?: () => void }) => {
  const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  useEffect(() => {
    loadAcompanhamentos();
  }, [userId]);

  const loadAcompanhamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("acompanhamento_semanal")
        .select("*")
        .eq("user_id", userId)
        .order("formulario_numero", { ascending: true });

      if (error) {
        console.error("Erro ao carregar acompanhamentos:", error);
        return;
      }

      setAcompanhamentos(data || []);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmarAnalise = async (acompanhamentoId: string) => {
    setConfirmando(acompanhamentoId);
    try {
      const { error } = await supabase
        .from("acompanhamento_semanal")
        .update({
          admin_visualizado: true,
          admin_visualizado_em: new Date().toISOString(),
        })
        .eq("id", acompanhamentoId);

      if (error) throw error;

      // Recarregar acompanhamentos
      await loadAcompanhamentos();
      
      // Notificar mudança para atualizar a lista
      if (onConfirmacaoChange) {
        onConfirmacaoChange();
      }
    } catch (err: any) {
      console.error("Erro ao confirmar análise:", err);
      alert("Erro ao confirmar análise: " + err.message);
    } finally {
      setConfirmando(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-white/70">Carregando acompanhamentos...</p>
      </div>
    );
  }

  if (acompanhamentos.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="text-lg font-black mb-4 text-red-400">Acompanhamentos</h2>
        <p className="text-white/70 text-sm">Nenhum acompanhamento registrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h2 className="text-lg font-black mb-4 text-red-400">Acompanhamentos</h2>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((numero) => {
          const acompanhamento = acompanhamentos.find((a) => a.formulario_numero === numero);
          const isExpanded = expandedId === (acompanhamento?.id || `pending-${numero}`);

          return (
            <div
              key={numero}
              className={`bg-gradient-to-r from-zinc-800 to-zinc-800/50 border-2 rounded-xl overflow-hidden transition-all ${
                acompanhamento
                  ? "border-emerald-700/50"
                  : "border-white/10 opacity-60"
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : acompanhamento?.id || `pending-${numero}`)}
                className="w-full p-4 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      acompanhamento
                        ? "bg-emerald-900/50 text-emerald-400"
                        : "bg-zinc-700 text-zinc-500"
                    }`}
                  >
                    {numero}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-black text-white">
                      Formulário #{numero}
                    </h3>
                    {acompanhamento ? (
                      <p className="text-xs text-white/70">
                        Preenchido em {new Date(acompanhamento.data_preenchimento).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      <p className="text-xs text-white/70">Ainda não preenchido</p>
                    )}
                  </div>
                  {acompanhamento && (
                    <span className="px-2 py-1 rounded text-xs font-black bg-emerald-900/50 text-emerald-400">
                      Preenchido
                    </span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-white/70 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && acompanhamento && (
                <div className="border-t border-white/10 bg-white/5/50 p-4 space-y-4">
                  {/* Status de visualização */}
                  {acompanhamento.admin_visualizado ? (
                    <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-3">
                      <p className="text-emerald-400 text-sm font-black flex items-center gap-2">
                        ✅ Análise confirmada
                        {acompanhamento.admin_visualizado_em && (
                          <span className="text-xs text-emerald-300 font-normal">
                            em {new Date(acompanhamento.admin_visualizado_em).toLocaleString("pt-BR")}
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-3">
                      <p className="text-yellow-400 text-sm font-black">
                        ⚠️ Aguardando análise do administrador
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {acompanhamento.hidratacao && (
                      <div className="bg-black p-3 rounded-xl">
                        <p className="text-sm text-white/70 mb-1">Hidratação</p>
                        <p className="text-white font-black">{acompanhamento.hidratacao} diariamente</p>
                      </div>
                    )}
                    {acompanhamento.horas_sono && (
                      <div className="bg-black p-3 rounded-xl">
                        <p className="text-sm text-white/70 mb-1">Sono</p>
                        <p className="text-white font-black">{acompanhamento.horas_sono} por dia</p>
                      </div>
                    )}
                    {acompanhamento.peso_atual && (
                      <div className="bg-black p-3 rounded-xl">
                        <p className="text-sm text-white/70 mb-1">Peso</p>
                        <p className="text-white font-black">{acompanhamento.peso_atual} kg</p>
                      </div>
                    )}
                    {acompanhamento.data_preenchimento && (
                      <div className="bg-black p-3 rounded-xl">
                        <p className="text-sm text-white/70 mb-1">Data de Preenchimento</p>
                        <p className="text-white font-black">
                          {new Date(acompanhamento.data_preenchimento).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>

                  {acompanhamento.treino_dias && Object.keys(acompanhamento.treino_dias).length > 0 && (
                    <div className="bg-black p-3 rounded-xl">
                      <p className="text-sm text-white/70 mb-2">Treino por dia</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(acompanhamento.treino_dias as Record<string, string>).map(([dia, perc]) => (
                          <div key={dia} className="bg-zinc-700 p-2 rounded text-sm">
                            <span className="text-zinc-300 font-black">{dia}:</span>{" "}
                            <span className="text-white">{perc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {acompanhamento.exercicios_realizados && acompanhamento.exercicios_realizados.length > 0 && (
                    <div className="bg-black p-3 rounded-xl">
                      <p className="text-sm text-white/70 mb-2">
                        Exercícios realizados ({acompanhamento.exercicios_realizados.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {acompanhamento.exercicios_realizados.map((ex: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-zinc-700 rounded text-sm text-white">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {acompanhamento.desafios_conquistas && (
                    <div className="bg-black p-3 rounded-xl">
                      <p className="text-sm text-white/70 mb-2">Desafios e conquistas</p>
                      <p className="text-white whitespace-pre-wrap">{acompanhamento.desafios_conquistas}</p>
                    </div>
                  )}

                  {/* Botão Confirmar Análise */}
                  {!acompanhamento.admin_visualizado && (
                    <div className="border-t border-white/10 pt-4">
                      <button
                        onClick={() => confirmarAnalise(acompanhamento.id)}
                        disabled={confirmando === acompanhamento.id}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                      >
                        {confirmando === acompanhamento.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Confirmando...
                          </>
                        ) : (
                          <>
                            ✅ Confirmar Análise
                          </>
                        )}
                      </button>
                      <p className="text-xs text-zinc-500 mt-2 text-center">
                        Ao confirmar, esta etiqueta será removida da lista de usuários
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isExpanded && !acompanhamento && (
                <div className="border-t border-white/10 bg-white/5/50 p-4 text-center">
                  <p className="text-white/70">Este formulário ainda não foi preenchido.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UserDetail = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [diasAdicionar, setDiasAdicionar] = useState<string>("");
  const [loadingAdicionar, setLoadingAdicionar] = useState(false);
  const [calculandoData, setCalculandoData] = useState(false);

  useEffect(() => {
    (async () => {
      const id = params.id;
      if (!id) {
        setError("ID inválido.");
        setLoading(false);
        return;
      }
      // Aceita tanto number quanto uuid
      const { data, error } = await supabase
        .from("consultoria_cadastros")
        .select("*")
        .eq("id", id)
        .single();
      if (error) setError(error.message);
      setRow(data);
      setLoading(false);
    })();
  }, [params.id]);

  // Calcular e salvar data de expiração se necessário (apenas se não existe e não tem dias adicionais)
  useEffect(() => {
    if (!row || !params.id || calculandoData) return;
    
    // Só calcular se não tem data_expiracao mas tem dias_acesso
    // E não tem dias_adicionais (para não sobrescrever quando admin adiciona dias)
    if (!row.data_expiracao && row.dias_acesso !== null && row.dias_acesso !== undefined && !row.dias_adicionais) {
      setCalculandoData(true);
      
      const calcularESalvarData = async () => {
        try {
          const diasTotais = (row.dias_acesso || 30) + (row.dias_adicionais || 0);
          let novaDataExpiracao: Date;
          
          if (row.created_at) {
            // Calcular a partir da data de criação
            const dataCriacao = new Date(row.created_at);
            novaDataExpiracao = new Date(dataCriacao);
            novaDataExpiracao.setDate(novaDataExpiracao.getDate() + diasTotais);
          } else {
            // Calcular a partir de hoje (novo usuário)
            novaDataExpiracao = new Date();
            novaDataExpiracao.setDate(novaDataExpiracao.getDate() + diasTotais);
          }
          
          const { error: updateError } = await supabase
            .from("consultoria_cadastros")
            .update({ data_expiracao: novaDataExpiracao.toISOString().split('T')[0] })
            .eq("id", params.id);
          
          if (updateError) {
            console.error("Erro ao salvar data de expiração:", updateError);
          } else {
            // Atualizar apenas a data_expiracao no estado
            setRow(prev => prev ? { ...prev, data_expiracao: novaDataExpiracao.toISOString().split('T')[0] } : null);
          }
        } catch (err) {
          console.error("Erro ao calcular data de expiração:", err);
        } finally {
          setCalculandoData(false);
        }
      };
      
      calcularESalvarData();
    }
  }, [row?.id, row?.data_expiracao, row?.dias_acesso, row?.dias_adicionais, params.id, calculandoData]);

  const adicionarDias = async () => {
    if (!diasAdicionar || isNaN(Number(diasAdicionar)) || Number(diasAdicionar) <= 0) {
      setError("Por favor, informe um número válido de dias (maior que 0)");
      return;
    }

    try {
      setLoadingAdicionar(true);
      setError(null);
      setActionMsg(null);

      const diasParaAdicionar = Number(diasAdicionar);
      const novosDiasAdicionais = (row.dias_adicionais || 0) + diasParaAdicionar;
      
      console.log("[UserDetail] Adicionando dias:", {
        diasParaAdicionar,
        diasAdicionaisAtuais: row.dias_adicionais,
        novosDiasAdicionais,
        dataExpiracaoAtual: row.data_expiracao
      });
      
      // Calcular nova data de expiração: data_expiracao atual + dias para adicionar
      // Ou se não tiver data_expiracao, usar hoje + dias_acesso + novos_dias_adicionais
      let novaDataExpiracao: string;
      
      if (row.data_expiracao) {
        // Se já tem data de expiração, adicionar os dias a essa data
        const dataExp = new Date(row.data_expiracao);
        dataExp.setDate(dataExp.getDate() + diasParaAdicionar);
        novaDataExpiracao = dataExp.toISOString().split('T')[0];
      } else {
        // Se não tem data, calcular a partir de hoje
        const diasTotais = (row.dias_acesso || 30) + novosDiasAdicionais;
        const dataExp = new Date();
        dataExp.setDate(dataExp.getDate() + diasTotais);
        novaDataExpiracao = dataExp.toISOString().split('T')[0];
      }

      console.log("[UserDetail] Nova data de expiração calculada:", novaDataExpiracao);

      const { data: updateData, error: updateError } = await supabase
        .from("consultoria_cadastros")
        .update({
          dias_adicionais: novosDiasAdicionais,
          data_expiracao: novaDataExpiracao,
          acesso_bloqueado: false
        })
        .eq("id", params.id)
        .select();

      if (updateError) {
        console.error("[UserDetail] Erro ao atualizar:", updateError);
        throw updateError;
      }

      console.log("[UserDetail] Dados atualizados no banco:", updateData);
      
      // Verificar se o update retornou dados (se não retornou, pode ser problema de RLS)
      if (!updateData || updateData.length === 0) {
        console.warn("[UserDetail] Update retornou array vazio - possível problema de RLS");
        throw new Error("Não foi possível atualizar os dados. Verifique as permissões.");
      }

      const updatedRecord = updateData[0];
      console.log("[UserDetail] Registro atualizado:", {
        id: updatedRecord.id,
        dias_adicionais: updatedRecord.dias_adicionais,
        data_expiracao: updatedRecord.data_expiracao
      });

      // Recarregar dados completos do banco para garantir sincronização
      const { data: updatedRow, error: reloadError } = await supabase
        .from("consultoria_cadastros")
        .select("*")
        .eq("id", params.id)
        .single();

      if (reloadError) {
        console.error("[UserDetail] Erro ao recarregar dados:", reloadError);
        // Usar os dados retornados pelo update
        if (updatedRecord) {
          console.log("[UserDetail] Usando dados do update:", updatedRecord);
          setRow({
            ...row,
            ...updatedRecord
          });
        } else {
          // Fallback: atualizar com os dados calculados
          setRow({
            ...row,
            dias_adicionais: novosDiasAdicionais,
            data_expiracao: novaDataExpiracao,
            acesso_bloqueado: false
          });
        }
      } else {
        console.log("[UserDetail] Dados recarregados do banco:", {
          id: updatedRow.id,
          dias_adicionais: updatedRow.dias_adicionais,
          data_expiracao: updatedRow.data_expiracao
        });
        setRow(updatedRow);
      }

      setActionMsg(`✅ ${diasParaAdicionar} dias adicionados com sucesso! Nova data de expiração: ${new Date(novaDataExpiracao).toLocaleDateString('pt-BR')}`);
      setDiasAdicionar("");
    } catch (e: any) {
      console.error("[UserDetail] Erro ao adicionar dias:", e);
      setError(e.message || "Erro ao adicionar dias. Tente novamente.");
    } finally {
      setLoadingAdicionar(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!row) return <div>Registro não encontrado.</div>;

  const fields = [
    { label: "E-mail", key: "email" },
    { label: "Nome completo", key: "nome_completo" },
    { label: "Plano contratado", key: "plano_contratado" },
    { label: "Data de nascimento", key: "data_nascimento" },
    { label: "Telefone (DDD)", key: "telefone" },
    { label: "CPF", key: "cpf" },
    { label: "Estado", key: "estado" },
    { label: "Endereço completo", key: "endereco_completo" },
    { label: "Objetivo", key: "objetivo" },
    { label: "Altura (m)", key: "altura_metros" },
    { label: "Peso atual (kg)", key: "peso_atual" },
    { label: "Alteração de peso (últimos 3 meses)", key: "alteracao_peso_detalhes" },
    { label: "Ocupação", key: "ocupacao" },
    { label: "Renda per capita", key: "renda_per_capita" },
    { label: "Patologias/Sintomas", key: "patologias" },
    { label: "Sintomas adicionais", key: "sintomas_adicionais" },
    { label: "Quem cozinha suas refeições?", key: "quem_cozinha" },
    { label: "Mora com quantas pessoas? Parentesco?", key: "mora_com_quantos" },
    { label: "Escala de Bristol", key: "escala_bristol" },
    { label: "Foto de frente (URL)", key: "foto_frente_url" },
    { label: "Foto de costas (URL)", key: "foto_costas_url" },
    { label: "Foto de lado (URL)", key: "foto_lado_url" },
    { label: "Foto/Vídeo livre (URL)", key: "foto_video_livre_url" },
    // Novos campos de treinamento
    { label: "Exercício físico praticado", key: "exercicio_fisico_pratica" },
    { label: "Tempo de prática do esporte", key: "tempo_pratica_esporte" },
    { label: "Tipo de academia", key: "tipo_academia" },
    { label: "Horário de treino", key: "horario_treino" },
    { label: "Musculatura segundo enfoque", key: "musculatura_segundo_enfoque" },
    { label: "Divisão de treino atual", key: "divisao_treino_atual" },
    { label: "Exercícios e séries", key: "exercicios_series_detalhes" },
    { label: "Limitações/Desconforto articular", key: "limitacao_desconforto_articular" },
    { label: "Uso de esteroides", key: "uso_esteroides" },
    { label: "Outros esportes", key: "outros_esportes" },
    { label: "Aparelhos de costas disponíveis", key: "aparelhos_costas" },
    { label: "Aparelhos de peito disponíveis", key: "aparelhos_peito" },
    { label: "Frequência de prática", key: "frequencia_pratica" },
    { label: "Tempo disponível para treino", key: "tempo_disponivel_treino" },
    // Novos campos - Etapas 11-14
    { label: "Aparelhos de deltoide disponíveis", key: "aparelhos_deltoide" },
    { label: "Aparelhos de membros inferiores", key: "aparelhos_membros_inferiores" },
    { label: "Máquinas faltando", key: "maquinas_faltando" },
    { label: "Qualidade do sono (escala 0-10)", key: "qualidade_sono_escala" },
    { label: "Horas de sono por noite", key: "horas_sono_noite" },
    { label: "Observações sobre o sono", key: "observacao_sono" },
    { label: "Fuma (frequência)", key: "fuma_frequencia" },
    { label: "Bebidas alcoólicas (frequência)", key: "bebidas_alcoolicas_frequencia" },
    { label: "Rotina Segunda-feira", key: "rotina_segunda" },
    { label: "Rotina Terça-feira", key: "rotina_terca" },
    { label: "Rotina Quarta-feira", key: "rotina_quarta" },
    { label: "Rotina Quinta-feira", key: "rotina_quinta" },
  ];

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex justify-center w-full">
      <div className="space-y-6 max-w-4xl w-full">
        <button onClick={handleGoBack} className="px-3 py-1 rounded-xl bg-black border border-white/10 hover:bg-zinc-700">
          ← Voltar
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">{row.nome_completo || "Perfil do usuário"}</h1>
            <p className="text-white/70 text-sm mt-1">Status: <span className="font-black">{row.status || "pending"}</span></p>
          </div>
        </div>

        {actionMsg && (
          <div className="bg-emerald-900/20 border border-emerald-900/40 rounded-xl p-3 text-emerald-400">
            {actionMsg}
          </div>
        )}

        {/* Gráficos de Performance */}
        {row.user_id && (
          <div className="mb-6">
            <ProgressCharts userId={row.user_id} isAdmin={true} />
          </div>
        )}

        {/* Seção de Controle de Acesso */}
        {row.user_id && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h2 className="text-lg font-black mb-4 text-red-400">Controle de Acesso</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Dias de Acesso Inicial</label>
                <p className="text-white font-black">{row.dias_acesso || 30} dias</p>
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-1">Dias Adicionais</label>
                <p className="text-white font-black">{row.dias_adicionais || 0} dias</p>
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-1">Data de Expiração</label>
                {(() => {
                  // Calcular data de expiração para exibição
                  // Se tem data_expiracao salva, usar ela
                  // Se não tem, calcular baseado em created_at + dias_acesso + dias_adicionais
                  let dataExpiracao: Date | null = null;
                  
                  if (row.data_expiracao) {
                    // Usar data salva no banco
                    dataExpiracao = new Date(row.data_expiracao);
                  } else if (row.dias_acesso !== null && row.dias_acesso !== undefined) {
                    // Calcular se não tem data salva mas tem dias_acesso
                    const diasTotais = (row.dias_acesso || 30) + (row.dias_adicionais || 0);
                    
                    if (row.created_at) {
                      // Calcular a partir da data de criação
                      const dataCriacao = new Date(row.created_at);
                      dataExpiracao = new Date(dataCriacao);
                      dataExpiracao.setDate(dataExpiracao.getDate() + diasTotais);
                    } else {
                      // Calcular a partir de hoje (fallback para novos usuários)
                      dataExpiracao = new Date();
                      dataExpiracao.setDate(dataExpiracao.getDate() + diasTotais);
                    }
                  }
                  
                  if (!dataExpiracao) {
                    return (
                      <>
                        <p className="font-black text-zinc-500">Não definida</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Configure os dias de acesso para calcular a data de expiração
                        </p>
                      </>
                    );
                  }
                  
                  // Calcular dias restantes
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  const dataExp = new Date(dataExpiracao);
                  dataExp.setHours(0, 0, 0, 0);
                  const diasRestantes = Math.ceil((dataExp.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                  const expirado = dataExp < hoje;
                  
                  return (
                    <>
                      <p className={`font-black ${expirado ? 'text-red-400' : 'text-white'}`}>
                        {dataExpiracao.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {expirado 
                          ? '⚠️ Acesso expirado' 
                          : diasRestantes > 0
                          ? `Restam ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`
                          : 'Expira hoje'}
                      </p>
                    </>
                  );
                })()}
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-1">Status de Acesso</label>
                {(() => {
                  // Calcular status baseado em data_expiracao ou dias_acesso
                  let dataExpiracao: Date | null = null;
                  
                  if (row.data_expiracao) {
                    dataExpiracao = new Date(row.data_expiracao);
                  } else if (row.dias_acesso !== null && row.dias_acesso !== undefined) {
                    const diasTotais = (row.dias_acesso || 30) + (row.dias_adicionais || 0);
                    if (row.created_at) {
                      const dataCriacao = new Date(row.created_at);
                      dataExpiracao = new Date(dataCriacao);
                      dataExpiracao.setDate(dataExpiracao.getDate() + diasTotais);
                    } else {
                      dataExpiracao = new Date();
                      dataExpiracao.setDate(dataExpiracao.getDate() + diasTotais);
                    }
                  }
                  
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  const expirado = dataExpiracao && new Date(dataExpiracao) < hoje;
                  const bloqueado = row.acesso_bloqueado;
                  
                  return (
                    <p className={`font-black ${bloqueado || expirado ? 'text-red-400' : 'text-emerald-400'}`}>
                      {bloqueado 
                        ? '🚫 Bloqueado' 
                        : expirado
                        ? '⏱️ Expirado'
                        : '✅ Ativo'}
                    </p>
                  );
                })()}
              </div>
            </div>

            {/* Campo para adicionar mais dias */}
            <div className="border-t border-white/10 pt-4">
              <label className="block text-sm text-white/70 mb-2">Adicionar Mais Dias</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={diasAdicionar}
                  onChange={(e) => setDiasAdicionar(e.target.value)}
                  placeholder="Ex: 30"
                  min="1"
                  className="flex-1 p-3 rounded-xl border border-white/10 bg-black text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={adicionarDias}
                  disabled={loadingAdicionar || !diasAdicionar}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAdicionar ? "Adicionando..." : "Adicionar Dias"}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Os dias serão adicionados à data de expiração atual do usuário.
              </p>
            </div>
          </div>
        )}

        {/* Seção de Acompanhamentos */}
        {row.user_id && (
          <AcompanhamentosSection 
            userId={row.user_id} 
            onConfirmacaoChange={() => {
              // Recarregar dados do usuário para atualizar status
              // Isso não é necessário aqui, mas pode ser útil no futuro
            }}
          />
        )}

        {/* Seção de Orientações Expert */}
        {row.user_id && (
          <OrientacoesExpertSection userId={row.user_id} userEmail={row.email} />
        )}

        {/* Seção de Suporte */}
        {row.user_id && (
          <SuporteSection userId={row.user_id} userEmail={row.email} />
        )}

        {/* Seção de Dieta */}
        {row.user_id && (
          <DietaSection userId={row.user_id} />
        )}

        {/* Seção de Treino */}
        {row.user_id && (
          <TreinoSection userId={row.user_id} />
        )}

        {/* Título e Divisor */}
        <div className="mt-12 mb-6">
          <h2 className="text-2xl font-black text-white border-b border-white/10 pb-3">
            Formulário Base Consultoria
          </h2>
        </div>

        {/* Mensagem se formulário não foi preenchido */}
        {row.user_id && (row.form_preenchido === false || row.form_preenchido === null) && (
          <div className="bg-yellow-900/20 border border-yellow-900/40 rounded-xl p-4 text-yellow-400">
            <p className="font-black mb-1">⚠️ Usuário ainda não completou formulário</p>
            <p className="text-sm text-yellow-300">
              Este usuário foi criado pelo administrador mas ainda não preencheu o formulário de cadastro.
              O formulário não estará disponível abaixo até que o usuário faça login e complete o cadastro.
            </p>
          </div>
        )}

        {/* Mostrar formulário apenas se foi preenchido */}
        {(!row.user_id || row.form_preenchido === true) && (
          <div className="space-y-4">
            {fields.map(({ label, key }) => {
              const value = row[key];
              if (value === null || value === undefined || value === "") return null;

          return (
            <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-sm font-black text-red-400 mb-2">{label}</div>
              <div className="text-white">
                {Array.isArray(value) ? (
                  // Renderizar arrays (aparelhos de academia)
                  <div className="flex flex-wrap gap-2">
                    {value.length > 0 ? (
                      value.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-red-900/30 text-red-400 text-sm border border-red-700/50"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-white/50 text-sm">Nenhum selecionado</span>
                    )}
                  </div>
                ) : typeof value === "object" ? (
                  // Renderizar patologias como tabela legível
                  <div className="space-y-2">
                    {Object.entries(value as Record<string, string>).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                        <span className="text-sm text-zinc-300 capitalize">{k.replace(/_/g, " ")}</span>
                        <span className={`text-sm font-black px-3 py-1 rounded-full ${
                          v === "Nunca" ? "bg-black text-white/70" :
                          v === "Raramente" ? "bg-yellow-900/30 text-yellow-400" :
                          v === "Ocasionalmente" ? "bg-orange-900/30 text-orange-400" :
                          v === "Frequentemente" ? "bg-red-900/30 text-red-400" :
                          "bg-black text-white"
                        }`}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : key.includes("url") && value ? (
                  <div className="space-y-2">
                    <img 
                      src={value} 
                      alt={label}
                      className="w-32 h-32 object-cover rounded-xl border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(value, '_blank')}
                    />
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:underline break-all block">
                      Abrir em tela cheia →
                    </a>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{String(value)}</p>
                )}
              </div>
            </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para gerenciar orientações expert
const OrientacoesExpertSection = ({ userId, userEmail }: { userId: string; userEmail?: string | null }) => {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [expandedMensagem, setExpandedMensagem] = useState<string | null>(null);

  useEffect(() => {
    loadMensagens();
  }, [userId]);

  const loadMensagens = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      // Buscar mensagens do usuário
      const { data, error } = await supabase
        .from("orientacoes_expert")
        .select("*")
        .eq("user_id", userId)
        .order("enviado_em", { ascending: false });

      if (error) {
        console.error("Erro ao carregar mensagens:", error);
        return;
      }

      setMensagens(data || []);
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

      const { error } = await supabase.from("orientacoes_expert").insert([
        {
          user_id: userId,
          user_email: userEmail || null,
          mensagem: novaMensagem.trim(),
          enviado_por: session.session.user.id,
          enviado_por_email: session.session.user.email || null,
          lido: false,
        },
      ]);

      if (error) {
        throw error;
      }

      setNovaMensagem("");
      await loadMensagens();
      alert("Mensagem enviada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      alert("Erro ao enviar mensagem: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const mensagensNaoLidas = mensagens.filter((m) => !m.lido).length;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h2 className="text-lg font-black text-red-400 flex items-center gap-2">
          💬 Orientações Expert
          {mensagensNaoLidas > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-black bg-purple-900/50 text-red-400 border border-purple-700">
              {mensagensNaoLidas} {mensagensNaoLidas === 1 ? "não lida" : "não lidas"}
            </span>
          )}
        </h2>
        <svg
          className={`w-5 h-5 text-white/70 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Formulário para enviar nova mensagem */}
          <div className="bg-black border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-black text-white mb-3">Enviar Nova Orientação</h3>
            <textarea
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite a orientação para o usuário..."
              rows={4}
              className="w-full p-3 rounded-xl border border-zinc-600 bg-zinc-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
            />
            <button
              onClick={enviarMensagem}
              disabled={enviando || !novaMensagem.trim()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? "Enviando..." : "Enviar Mensagem"}
            </button>
          </div>

          {/* Lista de mensagens */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-white/70">Carregando mensagens...</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70">Nenhuma mensagem enviada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mensagens.map((mensagem) => {
                const isExpanded = expandedMensagem === mensagem.id;
                return (
                  <div
                    key={mensagem.id}
                    className={`bg-black border-2 rounded-xl overflow-hidden ${
                      !mensagem.lido
                        ? "border-purple-700/50 bg-purple-900/10"
                        : "border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedMensagem(isExpanded ? null : mensagem.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            !mensagem.lido ? "bg-purple-400" : "bg-zinc-600"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-black text-white">
                              {new Date(mensagem.enviado_em).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {mensagem.lido ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-900/50 text-emerald-400 border border-emerald-700">
                                ✓ Lido
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-purple-900/50 text-red-400 border border-purple-700">
                                Não lido
                              </span>
                            )}
                            {mensagem.lido_em && (
                              <span className="text-xs text-zinc-500">
                                Lido em {new Date(mensagem.lido_em).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/70 line-clamp-2">
                            {mensagem.mensagem}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/10 bg-white/5/50 p-4">
                        <p className="text-white whitespace-pre-wrap mb-3">{mensagem.mensagem}</p>
                        <div className="text-xs text-zinc-500 space-y-1">
                          <p>
                            <span className="font-black">Enviado em:</span>{" "}
                            {new Date(mensagem.enviado_em).toLocaleString("pt-BR")}
                          </p>
                          {mensagem.lido && mensagem.lido_em && (
                            <p>
                              <span className="font-black">Lido em:</span>{" "}
                              {new Date(mensagem.lido_em).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para gerenciar suporte
const SuporteSection = ({ userId, userEmail }: { userId: string; userEmail?: string | null }) => {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<string | null>(null);
  const [expandedMensagem, setExpandedMensagem] = useState<string | null>(null);

  useEffect(() => {
    loadMensagens();
  }, [userId]);

  const loadMensagens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("suporte")
        .select("*")
        .eq("user_id", userId)
        .order("mensagem_usuario_enviada_em", { ascending: false });

      if (error) {
        console.error("Erro ao carregar mensagens de suporte:", error);
        return;
      }

      setMensagens(data || []);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const enviarResposta = async (mensagemId: string) => {
    const resposta = respostas[mensagemId]?.trim();
    if (!resposta) {
      alert("Por favor, digite uma resposta.");
      return;
    }

    try {
      setEnviando(mensagemId);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      const { error } = await supabase
        .from("suporte")
        .update({
          resposta_admin: resposta,
          resposta_admin_enviada_por: session.session.user.id,
          resposta_admin_enviada_por_email: session.session.user.email || null,
          resposta_admin_enviada_em: new Date().toISOString(),
          lido_pelo_usuario: false,
        })
        .eq("id", mensagemId);

      if (error) {
        throw error;
      }

      setRespostas((prev) => {
        const newRespostas = { ...prev };
        delete newRespostas[mensagemId];
        return newRespostas;
      });
      await loadMensagens();
      alert("Resposta enviada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao enviar resposta:", err);
      alert("Erro ao enviar resposta: " + err.message);
    } finally {
      setEnviando(null);
    }
  };

  const mensagensSemResposta = mensagens.filter((m) => !m.resposta_admin || m.resposta_admin.trim() === "");

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h2 className="text-lg font-black text-red-400 flex items-center gap-2">
          🆘 Suporte
          {mensagensSemResposta.length > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-black bg-blue-900/50 text-blue-400 border border-blue-700">
              {mensagensSemResposta.length} {mensagensSemResposta.length === 1 ? "solicitação" : "solicitações"}
            </span>
          )}
        </h2>
        <svg
          className={`w-5 h-5 text-white/70 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-4 animate-fade-in">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-white/70">Carregando mensagens...</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70">Nenhuma solicitação de suporte ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mensagens.map((mensagem) => {
                const isExpanded = expandedMensagem === mensagem.id;
                const temResposta = mensagem.resposta_admin && mensagem.resposta_admin.trim() !== "";
                const respostaAtual = respostas[mensagem.id] || "";
                const estaEnviando = enviando === mensagem.id;

                return (
                  <div
                    key={mensagem.id}
                    className={`bg-black border-2 rounded-xl overflow-hidden ${
                      !temResposta
                        ? "border-blue-700/50 bg-blue-900/10"
                        : "border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedMensagem(isExpanded ? null : mensagem.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            !temResposta ? "bg-blue-400" : "bg-zinc-600"
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
                              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-900/50 text-emerald-400 border border-emerald-700">
                                ✓ Respondido
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-900/50 text-blue-400 border border-blue-700">
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
                            Mensagem do usuário:
                          </h4>
                          <p className="text-white whitespace-pre-wrap">{mensagem.mensagem_usuario}</p>
                          <p className="text-xs text-zinc-500 mt-2">
                            Enviada em:{" "}
                            {new Date(mensagem.mensagem_usuario_enviada_em).toLocaleString("pt-BR")}
                          </p>
                        </div>

                        {/* Resposta do admin */}
                        {temResposta ? (
                          <div className="border-t border-white/10 pt-4">
                            <h4 className="text-sm font-black text-red-400 mb-2">
                              Sua resposta:
                            </h4>
                            <p className="text-white whitespace-pre-wrap">{mensagem.resposta_admin}</p>
                            <p className="text-xs text-zinc-500 mt-2">
                              Respondido em:{" "}
                              {mensagem.resposta_admin_enviada_em &&
                                new Date(mensagem.resposta_admin_enviada_em).toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {mensagem.lido_pelo_usuario
                                ? "✓ Lido pelo usuário"
                                : "⏳ Aguardando leitura pelo usuário"}
                            </p>
                          </div>
                        ) : (
                          <div className="border-t border-white/10 pt-4">
                            <h4 className="text-sm font-black text-white mb-3">Responder:</h4>
                            <textarea
                              value={respostaAtual}
                              onChange={(e) =>
                                setRespostas((prev) => ({
                                  ...prev,
                                  [mensagem.id]: e.target.value,
                                }))
                              }
                              placeholder="Digite sua resposta..."
                              rows={4}
                              className="w-full p-3 rounded-xl border border-zinc-600 bg-zinc-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
                            />
                            <button
                              onClick={() => enviarResposta(mensagem.id)}
                              disabled={estaEnviando || !respostaAtual.trim()}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {estaEnviando ? "Enviando..." : "Enviar Resposta"}
                            </button>
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
      )}
    </div>
  );
};

// Componente para gerenciar dietas
const DietaSection = ({ userId }: { userId: string }) => {
  const [dietas, setDietas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoDieta, setEditandoDieta] = useState<string | null>(null);
  const [deletandoDieta, setDeletandoDieta] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    liquido: "",
    refeicao_1_acordar: "",
    refeicao_2_almoco: "",
    refeicao_3_lanche_tarde: "",
    refeicao_4_janta: "",
  });

  useEffect(() => {
    if (expanded) {
      loadDietas();
    }
  }, [userId, expanded]);

  const loadDietas = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se pelo menos um campo foi preenchido
    const temConteudo = Object.values(formData).some(val => val.trim() !== "");
    if (!temConteudo) {
      alert("Por favor, preencha pelo menos um campo da dieta.");
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      if (editandoDieta) {
        // Atualizar dieta existente
        const { error } = await supabase
          .from("dietas")
          .update({
            ...formData,
            enviado_por: session.session.user.id,
          })
          .eq("id", editandoDieta);

        if (error) throw error;
        alert("Dieta atualizada com sucesso!");
      } else {
        // Criar nova dieta
        const { error } = await supabase.from("dietas").insert([
          {
            user_id: userId,
            ...formData,
            enviado_por: session.session.user.id,
          },
        ]);

        if (error) throw error;
        alert("Dieta enviada com sucesso!");
      }

      setFormData({
        liquido: "",
        refeicao_1_acordar: "",
        refeicao_2_almoco: "",
        refeicao_3_lanche_tarde: "",
        refeicao_4_janta: "",
      });
      setMostrarFormulario(false);
      setEditandoDieta(null);
      await loadDietas();
    } catch (err: any) {
      console.error("Erro ao salvar dieta:", err);
      alert("Erro ao salvar dieta: " + err.message);
    }
  };

  const handleEdit = (dieta: any) => {
    setFormData({
      liquido: dieta.liquido || "",
      refeicao_1_acordar: dieta.refeicao_1_acordar || "",
      refeicao_2_almoco: dieta.refeicao_2_almoco || "",
      refeicao_3_lanche_tarde: dieta.refeicao_3_lanche_tarde || "",
      refeicao_4_janta: dieta.refeicao_4_janta || "",
    });
    setEditandoDieta(dieta.id);
    setMostrarFormulario(true);
  };

  const handleDelete = async (dietaId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta dieta?")) return;

    try {
      setDeletandoDieta(dietaId);
      const { error } = await supabase
        .from("dietas")
        .delete()
        .eq("id", dietaId);

      if (error) throw error;
      alert("Dieta deletada com sucesso!");
      await loadDietas();
    } catch (err: any) {
      console.error("Erro ao deletar dieta:", err);
      alert("Erro ao deletar dieta: " + err.message);
    } finally {
      setDeletandoDieta(null);
    }
  };

  const cancelarFormulario = () => {
    setFormData({
      liquido: "",
      refeicao_1_acordar: "",
      refeicao_2_almoco: "",
      refeicao_3_lanche_tarde: "",
      refeicao_4_janta: "",
    });
    setMostrarFormulario(false);
    setEditandoDieta(null);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h2 className="text-lg font-black text-red-400 flex items-center gap-2">
          🍽️ Dieta
          {dietas.length > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-black bg-red-900/50 text-red-400 border border-red-700">
              {dietas.length} {dietas.length === 1 ? "dieta" : "dietas"}
            </span>
          )}
        </h2>
        <svg
          className={`w-5 h-5 text-white/70 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <>
              {!mostrarFormulario ? (
                <button
                  onClick={() => setMostrarFormulario(true)}
                  className="w-full px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wide transition-colors"
                >
                  + Nova Dieta
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 bg-black/50 rounded-xl p-4">
                  <h3 className="text-lg font-black text-white mb-4">
                    {editandoDieta ? "Editar Dieta" : "Nova Dieta"}
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-black text-white/90 mb-2">Líquido</label>
                      <textarea
                        value={formData.liquido}
                        onChange={(e) => setFormData({ ...formData, liquido: e.target.value })}
                        className="w-full p-3 rounded-xl border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-y min-h-[100px]"
                        placeholder="Ex: 2L de água por dia&#10;1 copo de suco natural..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-white/90 mb-2">Refeição 1 - Ao Acordar</label>
                      <textarea
                        value={formData.refeicao_1_acordar}
                        onChange={(e) => setFormData({ ...formData, refeicao_1_acordar: e.target.value })}
                        className="w-full p-3 rounded-xl border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-y min-h-[100px]"
                        placeholder="Ex: 2 ovos mexidos&#10;1 fatia de pão integral..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-white/90 mb-2">Refeição 2 - Almoço</label>
                      <textarea
                        value={formData.refeicao_2_almoco}
                        onChange={(e) => setFormData({ ...formData, refeicao_2_almoco: e.target.value })}
                        className="w-full p-3 rounded-xl border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-y min-h-[100px]"
                        placeholder="Ex: 150g de frango grelhado&#10;100g de arroz integral..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-white/90 mb-2">Refeição 3 - Lanche da Tarde</label>
                      <textarea
                        value={formData.refeicao_3_lanche_tarde}
                        onChange={(e) => setFormData({ ...formData, refeicao_3_lanche_tarde: e.target.value })}
                        className="w-full p-3 rounded-xl border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-y min-h-[100px]"
                        placeholder="Ex: 1 banana&#10;1 colher de pasta de amendoim..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-white/90 mb-2">Refeição 4 - Janta</label>
                      <textarea
                        value={formData.refeicao_4_janta}
                        onChange={(e) => setFormData({ ...formData, refeicao_4_janta: e.target.value })}
                        className="w-full p-3 rounded-xl border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-y min-h-[100px]"
                        placeholder="Ex: 150g de salmão&#10;Salada verde à vontade..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wide transition-colors"
                    >
                      {editandoDieta ? "Atualizar" : "Enviar"} Dieta
                    </button>
                    <button
                      type="button"
                      onClick={cancelarFormulario}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-wide transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {dietas.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-base font-black text-white/90 uppercase tracking-wide">Dietas Enviadas</h3>
                  {dietas.map((dieta) => (
                    <div
                      key={dieta.id}
                      className="bg-black/50 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-white/50">
                            Enviada em {new Date(dieta.enviado_em).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(dieta)}
                            className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-black transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(dieta.id)}
                            disabled={deletandoDieta === dieta.id}
                            className="px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-black transition-colors disabled:opacity-50"
                          >
                            {deletandoDieta === dieta.id ? "Deletando..." : "Deletar"}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {dieta.liquido && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full">
                            <h4 className="text-sm md:text-base font-black text-red-400 mb-2 uppercase">💧 Líquido</h4>
                            <p className="text-sm md:text-base text-white/80 whitespace-pre-line leading-relaxed">{dieta.liquido}</p>
                          </div>
                        )}
                        {dieta.refeicao_1_acordar && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full">
                            <h4 className="text-sm md:text-base font-black text-red-400 mb-2 uppercase">🌅 Refeição 1 - Ao Acordar</h4>
                            <p className="text-sm md:text-base text-white/80 whitespace-pre-line leading-relaxed">{dieta.refeicao_1_acordar}</p>
                          </div>
                        )}
                        {dieta.refeicao_2_almoco && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full">
                            <h4 className="text-sm md:text-base font-black text-red-400 mb-2 uppercase">🍽️ Refeição 2 - Almoço</h4>
                            <p className="text-sm md:text-base text-white/80 whitespace-pre-line leading-relaxed">{dieta.refeicao_2_almoco}</p>
                          </div>
                        )}
                        {dieta.refeicao_3_lanche_tarde && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full">
                            <h4 className="text-sm md:text-base font-black text-red-400 mb-2 uppercase">☕ Refeição 3 - Lanche da Tarde</h4>
                            <p className="text-sm md:text-base text-white/80 whitespace-pre-line leading-relaxed">{dieta.refeicao_3_lanche_tarde}</p>
                          </div>
                        )}
                        {dieta.refeicao_4_janta && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full">
                            <h4 className="text-sm md:text-base font-black text-red-400 mb-2 uppercase">🌙 Refeição 4 - Janta</h4>
                            <p className="text-sm md:text-base text-white/80 whitespace-pre-line leading-relaxed">{dieta.refeicao_4_janta}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {dietas.length === 0 && !mostrarFormulario && (
                <div className="text-center py-8 text-white/50">
                  <p>Nenhuma dieta enviada ainda.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para gerenciar treinos
const TreinoSection = ({ userId }: { userId: string }) => {
  const [treinos, setTreinos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoTreino, setEditandoTreino] = useState<string | null>(null);
  const [deletandoTreino, setDeletandoTreino] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    explicacao_repeticoes: "",
    explicacao_series: "AQ = aquecimento – RC = reconhecimento de carga – ST = série de trabalho",
    tempo_descanso: "",
    progressao_carga: "",
    treino_a_dia: "Segunda-feira",
    treino_a_tipo: "Push" as "Push" | "Pull" | "Lower" | "Upper" | "",
    treino_a_exercicios: [] as Array<{ exercicio: string; serie: string }>,
    treino_b_dia: "Terça-feira",
    treino_b_tipo: "Push" as "Push" | "Pull" | "Lower" | "Upper" | "",
    treino_b_exercicios: [] as Array<{ exercicio: string; serie: string }>,
    treino_c_dia: "Quarta-feira",
    treino_c_tipo: "Push" as "Push" | "Pull" | "Lower" | "Upper" | "",
    treino_c_exercicios: [] as Array<{ exercicio: string; serie: string }>,
    treino_d_dia: "Sexta-feira",
    treino_d_tipo: "Push" as "Push" | "Pull" | "Lower" | "Upper" | "",
    treino_d_exercicios: [] as Array<{ exercicio: string; serie: string }>,
    treino_e_dia: "Sábado",
    treino_e_tipo: "Push" as "Push" | "Pull" | "Lower" | "Upper" | "",
    treino_e_exercicios: [] as Array<{ exercicio: string; serie: string }>,
  });

  useEffect(() => {
    if (expanded) {
      loadTreinos();
    }
  }, [userId, expanded]);

  const loadTreinos = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se pelo menos um campo foi preenchido
    const temConteudo = 
      formData.explicacao_repeticoes.trim() !== "" ||
      formData.tempo_descanso.trim() !== "" ||
      formData.progressao_carga.trim() !== "" ||
      formData.treino_a_exercicios.some(e => e.exercicio.trim() !== "") ||
      formData.treino_b_exercicios.some(e => e.exercicio.trim() !== "") ||
      formData.treino_c_exercicios.some(e => e.exercicio.trim() !== "") ||
      formData.treino_d_exercicios.some(e => e.exercicio.trim() !== "") ||
      formData.treino_e_exercicios.some(e => e.exercicio.trim() !== "");
      
    if (!temConteudo) {
      alert("Por favor, preencha pelo menos um campo do treino.");
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      // Filtrar exercícios vazios antes de salvar
      const treinoData = {
        explicacao_repeticoes: formData.explicacao_repeticoes,
        explicacao_series: formData.explicacao_series,
        tempo_descanso: formData.tempo_descanso,
        progressao_carga: formData.progressao_carga,
        treino_a_dia: formData.treino_a_dia,
        treino_a_tipo: formData.treino_a_tipo,
        treino_a_exercicios: formData.treino_a_exercicios.filter(e => e.exercicio.trim() !== ""),
        treino_b_dia: formData.treino_b_dia,
        treino_b_tipo: formData.treino_b_tipo,
        treino_b_exercicios: formData.treino_b_exercicios.filter(e => e.exercicio.trim() !== ""),
        treino_c_dia: formData.treino_c_dia,
        treino_c_tipo: formData.treino_c_tipo,
        treino_c_exercicios: formData.treino_c_exercicios.filter(e => e.exercicio.trim() !== ""),
        treino_d_dia: formData.treino_d_dia,
        treino_d_tipo: formData.treino_d_tipo,
        treino_d_exercicios: formData.treino_d_exercicios.filter(e => e.exercicio.trim() !== ""),
        treino_e_dia: formData.treino_e_dia,
        treino_e_tipo: formData.treino_e_tipo,
        treino_e_exercicios: formData.treino_e_exercicios.filter(e => e.exercicio.trim() !== ""),
        enviado_por: session.session.user.id,
      };

      if (editandoTreino) {
        // Atualizar treino existente
        const { error } = await supabase
          .from("treinos")
          .update(treinoData)
          .eq("id", editandoTreino);

        if (error) throw error;
        alert("Treino atualizado com sucesso!");
      } else {
        // Criar novo treino
        const { error } = await supabase.from("treinos").insert([
          {
            user_id: userId,
            ...treinoData,
          },
        ]);

        if (error) throw error;
        alert("Treino enviado com sucesso!");
      }

      // Resetar formulário
      setFormData({
        explicacao_repeticoes: "",
        explicacao_series: "AQ = aquecimento – RC = reconhecimento de carga – ST = série de trabalho",
        tempo_descanso: "",
        progressao_carga: "",
        treino_a_dia: "Segunda-feira",
        treino_a_tipo: "Push",
        treino_a_exercicios: [],
        treino_b_dia: "Terça-feira",
        treino_b_tipo: "Push",
        treino_b_exercicios: [],
        treino_c_dia: "Quarta-feira",
        treino_c_tipo: "Push",
        treino_c_exercicios: [],
        treino_d_dia: "Sexta-feira",
        treino_d_tipo: "Push",
        treino_d_exercicios: [],
        treino_e_dia: "Sábado",
        treino_e_tipo: "Push",
        treino_e_exercicios: [],
      });
      setMostrarFormulario(false);
      setEditandoTreino(null);
      await loadTreinos();
    } catch (err: any) {
      console.error("Erro ao salvar treino:", err);
      alert("Erro ao salvar treino: " + err.message);
    }
  };

  const handleEdit = (treino: any) => {
    // Garantir que sempre temos arrays com pelo menos 10 posições
    const padExercicios = (exercicios: any[]) => {
      const padded = [...(exercicios || [])];
      while (padded.length < 10) {
        padded.push({ exercicio: "", serie: "" });
      }
      return padded.slice(0, 10);
    };

    setFormData({
      explicacao_repeticoes: treino.explicacao_repeticoes || "",
      explicacao_series: treino.explicacao_series || "AQ = aquecimento – RC = reconhecimento de carga – ST = série de trabalho",
      tempo_descanso: treino.tempo_descanso || "",
      progressao_carga: treino.progressao_carga || "",
      treino_a_dia: treino.treino_a_dia || "Segunda-feira",
      treino_a_tipo: treino.treino_a_tipo || "Push",
      treino_a_exercicios: padExercicios(treino.treino_a_exercicios || []),
      treino_b_dia: treino.treino_b_dia || "Terça-feira",
      treino_b_tipo: treino.treino_b_tipo || "Push",
      treino_b_exercicios: padExercicios(treino.treino_b_exercicios || []),
      treino_c_dia: treino.treino_c_dia || "Quarta-feira",
      treino_c_tipo: treino.treino_c_tipo || "Push",
      treino_c_exercicios: padExercicios(treino.treino_c_exercicios || []),
      treino_d_dia: treino.treino_d_dia || "Sexta-feira",
      treino_d_tipo: treino.treino_d_tipo || "Push",
      treino_d_exercicios: padExercicios(treino.treino_d_exercicios || []),
      treino_e_dia: treino.treino_e_dia || "Sábado",
      treino_e_tipo: treino.treino_e_tipo || "Push",
      treino_e_exercicios: padExercicios(treino.treino_e_exercicios || []),
    });
    setEditandoTreino(treino.id);
    setMostrarFormulario(true);
  };

  const handleDelete = async (treinoId: string) => {
    if (!confirm("Tem certeza que deseja deletar este treino?")) return;

    try {
      setDeletandoTreino(treinoId);
      const { error } = await supabase
        .from("treinos")
        .delete()
        .eq("id", treinoId);

      if (error) throw error;
      alert("Treino deletado com sucesso!");
      await loadTreinos();
    } catch (err: any) {
      console.error("Erro ao deletar treino:", err);
      alert("Erro ao deletar treino: " + err.message);
    } finally {
      setDeletandoTreino(null);
    }
  };

  const cancelarFormulario = () => {
    setFormData({
      explicacao_repeticoes: "",
      explicacao_series: "AQ = aquecimento – RC = reconhecimento de carga – ST = série de trabalho",
      tempo_descanso: "",
      progressao_carga: "",
      treino_a_dia: "Segunda-feira",
      treino_a_tipo: "Push",
      treino_a_exercicios: [],
      treino_b_dia: "Terça-feira",
      treino_b_tipo: "Push",
      treino_b_exercicios: [],
      treino_c_dia: "Quarta-feira",
      treino_c_tipo: "Push",
      treino_c_exercicios: [],
      treino_d_dia: "Sexta-feira",
      treino_d_tipo: "Push",
      treino_d_exercicios: [],
      treino_e_dia: "Sábado",
      treino_e_tipo: "Push",
      treino_e_exercicios: [],
    });
    setMostrarFormulario(false);
    setEditandoTreino(null);
  };

  const tiposTreino = ["Push", "Pull", "Lower", "Upper"];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h2 className="text-lg font-black text-red-400 flex items-center gap-2">
          💪 Treino
          {treinos.length > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-black bg-red-900/50 text-red-400 border border-red-700">
              {treinos.length} {treinos.length === 1 ? "treino" : "treinos"}
            </span>
          )}
        </h2>
        <svg
          className={`w-5 h-5 text-white/70 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-white/20 border-t-red-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <>
              {!mostrarFormulario ? (
                <button
                  onClick={() => setMostrarFormulario(true)}
                  className="w-full px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wide transition-colors"
                >
                  + Novo Treino
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 bg-black/50 rounded-xl p-4">
                  <h3 className="text-base font-black text-white mb-4">
                    {editandoTreino ? "Editar Treino" : "Novo Treino"}
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    {/* Explicações Gerais */}
                    <div>
                      <label className="block text-xs font-black text-white/90 mb-1.5">Explicação sobre o número de repetições</label>
                      <textarea
                        value={formData.explicacao_repeticoes}
                        onChange={(e) => setFormData({ ...formData, explicacao_repeticoes: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-y min-h-[80px] text-sm"
                        placeholder="Explicação sobre repetições..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-white/90 mb-1.5">Explicação sobre as séries</label>
                      <textarea
                        value={formData.explicacao_series}
                        onChange={(e) => setFormData({ ...formData, explicacao_series: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-y min-h-[60px] text-sm"
                        rows={2}
                      />
                      <p className="text-xs text-white/50 mt-1">AQ = aquecimento – RC = reconhecimento de carga – ST = série de trabalho</p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-white/90 mb-1.5">Tempo de descanso</label>
                      <textarea
                        value={formData.tempo_descanso}
                        onChange={(e) => setFormData({ ...formData, tempo_descanso: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-y min-h-[80px] text-sm"
                        placeholder="Ex: 60 segundos entre séries..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-white/90 mb-1.5">Progressão de carga</label>
                      <textarea
                        value={formData.progressao_carga}
                        onChange={(e) => setFormData({ ...formData, progressao_carga: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-y min-h-[80px] text-sm"
                        placeholder="Explicação sobre progressão..."
                        rows={3}
                      />
                    </div>

                    {/* Treino A */}
                    <DiaTreinoForm
                      dia={formData.treino_a_dia}
                      tipo={formData.treino_a_tipo}
                      onDiaChange={(dia) => setFormData({ ...formData, treino_a_dia: dia })}
                      onTipoChange={(tipo) => setFormData({ ...formData, treino_a_tipo: tipo as any })}
                      exercicios={formData.treino_a_exercicios}
                      onExerciciosChange={(exercicios) => setFormData({ ...formData, treino_a_exercicios: exercicios })}
                      tiposTreino={tiposTreino}
                    />

                    {/* Treino B */}
                    <DiaTreinoForm
                      dia={formData.treino_b_dia}
                      tipo={formData.treino_b_tipo}
                      onDiaChange={(dia) => setFormData({ ...formData, treino_b_dia: dia })}
                      onTipoChange={(tipo) => setFormData({ ...formData, treino_b_tipo: tipo as any })}
                      exercicios={formData.treino_b_exercicios}
                      onExerciciosChange={(exercicios) => setFormData({ ...formData, treino_b_exercicios: exercicios })}
                      tiposTreino={tiposTreino}
                    />

                    {/* Treino C */}
                    <DiaTreinoForm
                      dia={formData.treino_c_dia}
                      tipo={formData.treino_c_tipo}
                      onDiaChange={(dia) => setFormData({ ...formData, treino_c_dia: dia })}
                      onTipoChange={(tipo) => setFormData({ ...formData, treino_c_tipo: tipo as any })}
                      exercicios={formData.treino_c_exercicios}
                      onExerciciosChange={(exercicios) => setFormData({ ...formData, treino_c_exercicios: exercicios })}
                      tiposTreino={tiposTreino}
                    />

                    {/* Treino D */}
                    <DiaTreinoForm
                      dia={formData.treino_d_dia}
                      tipo={formData.treino_d_tipo}
                      onDiaChange={(dia) => setFormData({ ...formData, treino_d_dia: dia })}
                      onTipoChange={(tipo) => setFormData({ ...formData, treino_d_tipo: tipo as any })}
                      exercicios={formData.treino_d_exercicios}
                      onExerciciosChange={(exercicios) => setFormData({ ...formData, treino_d_exercicios: exercicios })}
                      tiposTreino={tiposTreino}
                    />

                    {/* Treino E */}
                    <DiaTreinoForm
                      dia={formData.treino_e_dia}
                      tipo={formData.treino_e_tipo}
                      onDiaChange={(dia) => setFormData({ ...formData, treino_e_dia: dia })}
                      onTipoChange={(tipo) => setFormData({ ...formData, treino_e_tipo: tipo as any })}
                      exercicios={formData.treino_e_exercicios}
                      onExerciciosChange={(exercicios) => setFormData({ ...formData, treino_e_exercicios: exercicios })}
                      tiposTreino={tiposTreino}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wide transition-colors text-sm"
                    >
                      {editandoTreino ? "Atualizar" : "Enviar"} Treino
                    </button>
                    <button
                      type="button"
                      onClick={cancelarFormulario}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-wide transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {treinos.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-sm font-black text-white/90 uppercase tracking-wide">Treinos Enviados</h3>
                  {treinos.map((treino) => (
                    <div
                      key={treino.id}
                      className="bg-black/50 border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-white/50">
                            Enviado em {new Date(treino.enviado_em).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(treino)}
                            className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-black transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(treino.id)}
                            disabled={deletandoTreino === treino.id}
                            className="px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-black transition-colors disabled:opacity-50"
                          >
                            {deletandoTreino === treino.id ? "Deletando..." : "Deletar"}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        {treino.explicacao_repeticoes && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                            <h4 className="text-xs font-black text-red-400 mb-1.5 uppercase">Explicação sobre o número de repetições</h4>
                            <p className="text-xs text-white/80 whitespace-pre-line leading-relaxed">{treino.explicacao_repeticoes}</p>
                          </div>
                        )}
                        {treino.explicacao_series && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                            <h4 className="text-xs font-black text-red-400 mb-1.5 uppercase">Explicação sobre as séries</h4>
                            <p className="text-xs text-white/80 whitespace-pre-line leading-relaxed">{treino.explicacao_series}</p>
                          </div>
                        )}
                        {treino.tempo_descanso && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                            <h4 className="text-xs font-black text-red-400 mb-1.5 uppercase">Tempo de descanso</h4>
                            <p className="text-xs text-white/80 whitespace-pre-line leading-relaxed">{treino.tempo_descanso}</p>
                          </div>
                        )}
                        {treino.progressao_carga && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                            <h4 className="text-xs font-black text-red-400 mb-1.5 uppercase">Progressão de carga</h4>
                            <p className="text-xs text-white/80 whitespace-pre-line leading-relaxed">{treino.progressao_carga}</p>
                          </div>
                        )}
                        {treino.treino_a_exercicios && Array.isArray(treino.treino_a_exercicios) && treino.treino_a_exercicios.length > 0 && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                            <h4 className="text-xs font-black text-red-400 mb-2 uppercase">
                              Treino A: {treino.treino_a_dia} ({treino.treino_a_tipo})
                            </h4>
                            <div className="space-y-1">
                              {treino.treino_a_exercicios.map((ex: any, idx: number) => (
                                ex.exercicio && (
                                  <div key={idx} className="text-xs text-white/80">
                                    <span className="font-bold">{ex.exercicio}</span>
                                    {ex.serie && <span className="text-white/60"> / {ex.serie}</span>}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                        {treino.treino_b_exercicios && Array.isArray(treino.treino_b_exercicios) && treino.treino_b_exercicios.length > 0 && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                            <h4 className="text-xs font-black text-red-400 mb-2 uppercase">
                              Treino B: {treino.treino_b_dia} ({treino.treino_b_tipo})
                            </h4>
                            <div className="space-y-1">
                              {treino.treino_b_exercicios.map((ex: any, idx: number) => (
                                ex.exercicio && (
                                  <div key={idx} className="text-xs text-white/80">
                                    <span className="font-bold">{ex.exercicio}</span>
                                    {ex.serie && <span className="text-white/60"> / {ex.serie}</span>}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                        {treino.treino_c_exercicios && Array.isArray(treino.treino_c_exercicios) && treino.treino_c_exercicios.length > 0 && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                            <h4 className="text-xs font-black text-red-400 mb-2 uppercase">
                              Treino C: {treino.treino_c_dia} ({treino.treino_c_tipo})
                            </h4>
                            <div className="space-y-1">
                              {treino.treino_c_exercicios.map((ex: any, idx: number) => (
                                ex.exercicio && (
                                  <div key={idx} className="text-xs text-white/80">
                                    <span className="font-bold">{ex.exercicio}</span>
                                    {ex.serie && <span className="text-white/60"> / {ex.serie}</span>}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                        {treino.treino_d_exercicios && Array.isArray(treino.treino_d_exercicios) && treino.treino_d_exercicios.length > 0 && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                            <h4 className="text-xs font-black text-red-400 mb-2 uppercase">
                              Treino D: {treino.treino_d_dia} ({treino.treino_d_tipo})
                            </h4>
                            <div className="space-y-1">
                              {treino.treino_d_exercicios.map((ex: any, idx: number) => (
                                ex.exercicio && (
                                  <div key={idx} className="text-xs text-white/80">
                                    <span className="font-bold">{ex.exercicio}</span>
                                    {ex.serie && <span className="text-white/60"> / {ex.serie}</span>}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                        {treino.treino_e_exercicios && Array.isArray(treino.treino_e_exercicios) && treino.treino_e_exercicios.length > 0 && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                            <h4 className="text-xs font-black text-red-400 mb-2 uppercase">
                              Treino E: {treino.treino_e_dia} ({treino.treino_e_tipo})
                            </h4>
                            <div className="space-y-1">
                              {treino.treino_e_exercicios.map((ex: any, idx: number) => (
                                ex.exercicio && (
                                  <div key={idx} className="text-xs text-white/80">
                                    <span className="font-bold">{ex.exercicio}</span>
                                    {ex.serie && <span className="text-white/60"> / {ex.serie}</span>}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {treinos.length === 0 && !mostrarFormulario && (
                <div className="text-center py-8 text-white/50 text-sm">
                  <p>Nenhum treino enviado ainda.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDetail;


