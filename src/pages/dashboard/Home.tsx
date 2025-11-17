import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProgressCharts from "@/components/ProgressCharts";
import { useNavigate } from "react-router-dom";

type FormData = {
  hidratacao: string;
  treino_dias: Record<string, string>;
  exercicios_realizados: string[];
  horas_sono: string;
  peso_atual: string;
  desafios_conquistas: string;
};

type FormularioStatus = {
  formulario_numero: number;
  desbloqueado: boolean;
  data_desbloqueio: string | null;
  preenchido: boolean;
  data_preenchimento: string | null;
  pode_preencher: boolean;
};

type OrientacaoExpert = {
  id: string;
  mensagem: string;
  enviado_por_email: string | null;
  enviado_em: string;
  lido: boolean;
  lido_em: string | null;
  created_at: string;
};

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const PERCENTUAIS = ["50%", "75%", "100%", "Não treinei"];

const EXERCICIOS = {
  Peito: [
    "Supino reto com barra",
    "Supino inclinado com barra",
    "Supino inclinado com halteres",
    "Supino declinado",
    "Crucifixo reto",
    "Crucifixo inclinado",
    "Crossover no cabo",
    "Peck deck (voador)",
    "Flexão de braço",
  ],
  Costas: [
    "Puxada frontal aberta",
    "Puxada supinada",
    "Puxada neutra",
    "Remada curvada com barra",
    "Remada unilateral com halter",
    "Remada baixa",
    "Remada cavalinho",
    "Puxada atrás da nuca",
    "Barra fixa",
    "Levantamento terra",
  ],
  Pernas: [
    "Agachamento livre",
    "Agachamento no Smith",
    "Leg press",
    "Cadeira extensora",
    "Cadeira flexora",
    "Stiff",
    "Passada / avanço",
    "Agachamento búlgaro",
    "Panturrilha em pé",
    "Panturrilha sentada",
    "Glúteo no cabo",
    "Cadeira abdutora",
    "Cadeira adutora",
  ],
  Ombros: [
    "Desenvolvimento com barra",
    "Desenvolvimento com halteres",
    "Elevação lateral",
    "Elevação frontal",
    "Remada alta",
    "Crucifixo inverso (posterior)",
    "Face pull",
  ],
  Bíceps: [
    "Rosca direta com barra",
    "Rosca alternada com halteres",
    "Rosca concentrada",
    "Rosca martelo",
    "Rosca scott",
    "Rosca 21",
  ],
  Tríceps: [
    "Tríceps corda",
    "Tríceps testa",
    "Tríceps banco",
    "Tríceps francês",
    "Tríceps mergulho",
    "Supino fechado",
  ],
  "Cardio / Condicionamento": [
    "Corrida na esteira",
    "Caminhada rápida",
    "Bicicleta ergométrica",
    "Escada",
    "Transport / elíptico",
    "Remo indoor",
    "Corrida de rua",
    "Pular corda",
    "HIIT",
    "Treino intervalado de corrida",
    "Subida de escadas",
    "Bike outdoor",
  ],
};

const Home = () => {
  const navigate = useNavigate();
  const [formularios, setFormularios] = useState<FormularioStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedForm, setExpandedForm] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [orientacoes, setOrientacoes] = useState<OrientacaoExpert[]>([]);
  const [orientacoesExpanded, setOrientacoesExpanded] = useState(false);
  const [orientacoesLoading, setOrientacoesLoading] = useState(false);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [chartsRefreshKey, setChartsRefreshKey] = useState(0);

  const [formData, setFormData] = useState<Record<number, FormData>>({
    1: { hidratacao: "", treino_dias: {}, exercicios_realizados: [], horas_sono: "", peso_atual: "", desafios_conquistas: "" },
    2: { hidratacao: "", treino_dias: {}, exercicios_realizados: [], horas_sono: "", peso_atual: "", desafios_conquistas: "" },
    3: { hidratacao: "", treino_dias: {}, exercicios_realizados: [], horas_sono: "", peso_atual: "", desafios_conquistas: "" },
    4: { hidratacao: "", treino_dias: {}, exercicios_realizados: [], horas_sono: "", peso_atual: "", desafios_conquistas: "" },
  });

  // Obter userId da sessão - DEVE SER O PRIMEIRO useEffect
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
          console.log("UserId obtido:", session.session.user.id);
          setUserId(session.session.user.id);
        } else {
          console.warn("Nenhuma sessão encontrada");
          setUserId(null);
        }
      } catch (err) {
        console.error("Erro ao obter userId:", err);
        setUserId(null);
      }
    };
    getUserId();
    
    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        console.log("Auth state changed, userId:", session.user.id);
        setUserId(session.user.id);
      } else {
        console.log("Auth state changed, no session");
        setUserId(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para carregar orientações
  const loadOrientacoes = async () => {
    try {
      setOrientacoesLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      // Buscar mensagens usando a função RPC
      const { data, error } = await supabase.rpc("buscar_mensagens_usuario", {
        p_user_id: session.session.user.id,
      });

      if (error) {
        console.error("Erro ao carregar orientações:", error);
        return;
      }

      if (data) {
        setOrientacoes(data || []);
        // Contar mensagens não lidas
        const naoLidas = (data || []).filter((m: OrientacaoExpert) => !m.lido).length;
        setMensagensNaoLidas(naoLidas);
      }
    } catch (err) {
      console.error("Erro ao carregar orientações:", err);
    } finally {
      setOrientacoesLoading(false);
    }
  };

  // Função para confirmar leitura
  const confirmarLeitura = async (mensagemId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      const { error } = await supabase.rpc("marcar_mensagem_lida", {
        p_mensagem_id: mensagemId,
        p_user_id: session.session.user.id,
      });

      if (error) {
        console.error("Erro ao confirmar leitura:", error);
        alert("Erro ao confirmar leitura: " + error.message);
        return;
      }

      // Recarregar orientações
      await loadOrientacoes();
    } catch (err: any) {
      console.error("Erro ao confirmar leitura:", err);
      alert("Erro ao confirmar leitura: " + err.message);
    }
  };

  useEffect(() => {
    loadFormularios();
    loadOrientacoes();
  }, []);

  // Carregar orientações periodicamente para verificar novas mensagens
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrientacoes();
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Fechar formulário automaticamente se ele for marcado como preenchido enquanto está expandido
  useEffect(() => {
    if (expandedForm !== null) {
      const formularioExpandido = formularios.find(f => f.formulario_numero === expandedForm);
      // Verificar se está preenchido (preenchido OU data_preenchimento existe)
      const isPreenchido = formularioExpandido?.preenchido || (formularioExpandido?.data_preenchimento !== null && formularioExpandido?.data_preenchimento !== undefined);
      if (isPreenchido) {
        console.log(`Formulário ${expandedForm} foi marcado como preenchido, fechando...`);
        setExpandedForm(null);
      }
    }
  }, [formularios, expandedForm]);

  const loadFormularios = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        console.error("Usuário não autenticado");
        setLoading(false);
        return;
      }

      console.log("Carregando formulários para user_id:", session.session.user.id);

      // Buscar status dos formulários
      const { data, error } = await supabase.rpc("formularios_disponiveis", {
        p_user_id: session.session.user.id,
      });

      if (error) {
        console.error("Erro ao carregar formulários:", error);
        console.error("Detalhes:", JSON.stringify(error, null, 2));
        
        // Fallback: criar estrutura básica com formulário 1 disponível
        const formulariosFallback: FormularioStatus[] = [
          {
            formulario_numero: 1,
            desbloqueado: true,
            data_desbloqueio: new Date().toISOString().split('T')[0],
            preenchido: false,
            data_preenchimento: null,
            pode_preencher: true,
          },
          {
            formulario_numero: 2,
            desbloqueado: false,
            data_desbloqueio: null,
            preenchido: false,
            data_preenchimento: null,
            pode_preencher: false,
          },
          {
            formulario_numero: 3,
            desbloqueado: false,
            data_desbloqueio: null,
            preenchido: false,
            data_preenchimento: null,
            pode_preencher: false,
          },
          {
            formulario_numero: 4,
            desbloqueado: false,
            data_desbloqueio: null,
            preenchido: false,
            data_preenchimento: null,
            pode_preencher: false,
          },
        ];
        setFormularios(formulariosFallback);
        setLoading(false);
        return;
      }

      console.log("Dados retornados da função:", data);

      if (data && Array.isArray(data) && data.length > 0) {
        // Ordenar por formulario_numero
        const sorted = [...data].sort((a, b) => a.formulario_numero - b.formulario_numero);
        console.log("Formulários ordenados:", sorted);
        
        // Log detalhado de cada formulário
        sorted.forEach((f) => {
          console.log(`Formulário ${f.formulario_numero}:`, {
            preenchido: f.preenchido,
            data_preenchimento: f.data_preenchimento,
            pode_preencher: f.pode_preencher,
            desbloqueado: f.desbloqueado,
          });
        });
        
        // Carregar dados preenchidos e atualizar estado (loadFormulariosPreenchidos já atualiza setFormularios)
        await loadFormulariosPreenchidos(sorted);
      } else {
        console.warn("Nenhum formulário retornado. Criando estrutura básica.");
        // Se não retornou dados válidos, criar estrutura básica com formulário 1 disponível
        const formulariosBasicos: FormularioStatus[] = [
          {
            formulario_numero: 1,
            desbloqueado: true,
            data_desbloqueio: new Date().toISOString().split('T')[0],
            preenchido: false,
            data_preenchimento: null,
            pode_preencher: true,
          },
          {
            formulario_numero: 2,
            desbloqueado: false,
            data_desbloqueio: null,
            preenchido: false,
            data_preenchimento: null,
            pode_preencher: false,
          },
          {
            formulario_numero: 3,
            desbloqueado: false,
            data_desbloqueio: null,
            preenchido: false,
            data_preenchimento: null,
            pode_preencher: false,
          },
          {
            formulario_numero: 4,
            desbloqueado: false,
            data_desbloqueio: null,
            preenchido: false,
            data_preenchimento: null,
            pode_preencher: false,
          },
        ];
        setFormularios(formulariosBasicos);
      }
    } catch (err) {
      console.error("Erro ao carregar formulários:", err);
      // Fallback em caso de erro
      const formulariosErro: FormularioStatus[] = [
        {
          formulario_numero: 1,
          desbloqueado: true,
          data_desbloqueio: new Date().toISOString().split('T')[0],
          preenchido: false,
          data_preenchimento: null,
          pode_preencher: true,
        },
        {
          formulario_numero: 2,
          desbloqueado: false,
          data_desbloqueio: null,
          preenchido: false,
          data_preenchimento: null,
          pode_preencher: false,
        },
        {
          formulario_numero: 3,
          desbloqueado: false,
          data_desbloqueio: null,
          preenchido: false,
          data_preenchimento: null,
          pode_preencher: false,
        },
        {
          formulario_numero: 4,
          desbloqueado: false,
          data_desbloqueio: null,
          preenchido: false,
          data_preenchimento: null,
          pode_preencher: false,
        },
      ];
      setFormularios(formulariosErro);
    } finally {
      setLoading(false);
    }
  };

  const loadFormulariosPreenchidos = async (statusList: FormularioStatus[]) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      const { data: preenchidos, error } = await supabase
        .from("acompanhamento_semanal")
        .select("*")
        .eq("user_id", session.session.user.id)
        .in("formulario_numero", [1, 2, 3, 4]);

      if (error) {
        console.error("Erro ao carregar formulários preenchidos:", error);
        return;
      }

      if (preenchidos && preenchidos.length > 0) {
        console.log("Formulários preenchidos encontrados:", preenchidos);
        
        const novosFormData = { ...formData };
        const formulariosAtualizados = statusList.map((form) => {
          const preenchido = preenchidos.find((p) => p.formulario_numero === form.formulario_numero);
          
          if (preenchido) {
            // Atualizar formData com dados do formulário preenchido
            novosFormData[form.formulario_numero] = {
              hidratacao: preenchido.hidratacao || "",
              treino_dias: (preenchido.treino_dias as Record<string, string>) || {},
              exercicios_realizados: preenchido.exercicios_realizados || [],
              horas_sono: preenchido.horas_sono || "",
              peso_atual: preenchido.peso_atual?.toString() || "",
              desafios_conquistas: preenchido.desafios_conquistas || "",
            };
            
            // Atualizar status do formulário para marcar como preenchido
            return {
              ...form,
              preenchido: true,
              data_preenchimento: preenchido.data_preenchimento || preenchido.created_at || new Date().toISOString(),
              pode_preencher: false,
              desbloqueado: true,
            };
          }
          
          return form;
        });
        
        setFormData(novosFormData);
        setFormularios(formulariosAtualizados);
        console.log("Formulários atualizados:", formulariosAtualizados);
      } else {
        // Se não há formulários preenchidos, usar statusList como está
        setFormularios(statusList);
      }
    } catch (err) {
      console.error("Erro ao carregar formulários preenchidos:", err);
    }
  };

  const handleSubmit = async (numero: number) => {
    setSubmitting({ ...submitting, [numero]: true });
    setMessages({ ...messages, [numero]: "" });

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) throw new Error("Usuário não autenticado");

      // Verificar se o formulário já foi preenchido antes de tentar inserir
      const formularioAtual = formularios.find(f => f.formulario_numero === numero);
      const isPreenchido = formularioAtual?.preenchido || (formularioAtual?.data_preenchimento !== null && formularioAtual?.data_preenchimento !== undefined);
      if (isPreenchido) {
        throw new Error("Este formulário já foi preenchido e não pode ser editado.");
      }

      // Verificar se já existe um registro no banco de dados
      const { data: existe, error: erroVerificacao } = await supabase
        .from("acompanhamento_semanal")
        .select("id, formulario_numero")
        .eq("user_id", session.session.user.id)
        .eq("formulario_numero", numero)
        .maybeSingle();

      if (existe) {
        throw new Error("Este formulário já foi preenchido. Recarregue a página para ver o status atualizado.");
      }

      const data = formData[numero];

      const { error } = await supabase.from("acompanhamento_semanal").insert([
        {
          user_id: session.session.user.id,
          user_email: session.session.user.email,
          formulario_numero: numero,
          semana_inicio: new Date().toISOString().split("T")[0],
          semana_fim: new Date().toISOString().split("T")[0],
          hidratacao: data.hidratacao,
          treino_dias: data.treino_dias,
          exercicios_realizados: data.exercicios_realizados,
          horas_sono: data.horas_sono,
          peso_atual: data.peso_atual ? parseFloat(data.peso_atual) : null,
          desafios_conquistas: data.desafios_conquistas || null,
        },
      ]);

      if (error) {
        // Se o erro for de constraint única, informar que já foi preenchido
        if (error.code === '23505' || error.message.includes('duplicate key') || error.message.includes('acompanhamento_formulario_unico')) {
          throw new Error("Este formulário já foi preenchido anteriormente. Recarregue a página para ver o status atualizado.");
        }
        throw error;
      }

      setMessages({ ...messages, [numero]: "✅ Formulário enviado com sucesso!" });
      
      // Atualizar estado imediatamente de forma otimista
      setFormularios((prev) => 
        prev.map((f) => 
          f.formulario_numero === numero
            ? {
                ...f,
                preenchido: true,
                data_preenchimento: new Date().toISOString(),
                pode_preencher: false,
                desbloqueado: true,
              }
            : f
        )
      );
      
      // Atualizar gráficos
      setChartsRefreshKey((prev) => prev + 1);
      
      // Fechar o formulário imediatamente
      setExpandedForm(null);
      
      // Recarregar do servidor após um delay para garantir sincronização
      setTimeout(async () => {
        console.log("Recarregando formulários após envio...");
        await loadFormularios();
        // Limpar mensagens após recarregar
        setMessages((prev) => ({ ...prev, [numero]: "" }));
      }, 1500);
    } catch (e: any) {
      setMessages({ ...messages, [numero]: `❌ Erro: ${e.message}` });
    } finally {
      setSubmitting({ ...submitting, [numero]: false });
    }
  };

  const toggleExercicio = (numero: number, exercicio: string) => {
    setFormData((prev) => ({
      ...prev,
      [numero]: {
        ...prev[numero],
        exercicios_realizados: prev[numero].exercicios_realizados.includes(exercicio)
          ? prev[numero].exercicios_realizados.filter((e) => e !== exercicio)
          : [...prev[numero].exercicios_realizados, exercicio],
      },
    }));
  };

  const getStatusBadge = (form: FormularioStatus) => {
    // Verificar se está preenchido (verificação dupla: preenchido OU data_preenchimento existe)
    const isPreenchido = form.preenchido || (form.data_preenchimento !== null && form.data_preenchimento !== undefined);
    
    if (isPreenchido) {
      return (
        <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white/10 text-white border border-white/20">
          ✅ Confirmado
        </span>
      );
    }
    // Formulário 1 sempre mostra como disponível se não estiver preenchido
    if (form.formulario_numero === 1) {
      return (
        <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-red-600 text-white border border-red-700">
          🔓 Disponível
        </span>
      );
    }
    if (form.pode_preencher) {
      return (
        <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-red-600 text-white border border-red-700">
          🔓 Disponível
        </span>
      );
    }
    if (form.desbloqueado) {
      return (
        <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white/5 text-white/60 border border-white/10">
          ⏳ Aguardando
        </span>
      );
    }
    return (
      <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white/5 text-white/40 border border-white/5">
        🔒 Bloqueado
      </span>
    );
  };

  const renderFormulario = (form: FormularioStatus) => {
    const data = formData[form.formulario_numero];
    const isExpanded = expandedForm === form.formulario_numero;
    
    // Verificar se formulário está preenchido (verificação dupla: preenchido OU data_preenchimento existe)
    const isPreenchido = form.preenchido || (form.data_preenchimento !== null && form.data_preenchimento !== undefined);
    
    // Formulário 1 sempre pode ser editado se não estiver preenchido
    // Outros formulários só podem ser editados se pode_preencher for true
    const canEdit = isPreenchido 
      ? false 
      : form.formulario_numero === 1 
        ? true 
        : form.pode_preencher;

    return (
      <div
        key={form.formulario_numero}
        className={`bg-black border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
          isPreenchido
            ? "border-white/20 bg-white/5"
            : form.pode_preencher
            ? "border-red-600/50 hover:border-red-600 bg-white/5"
            : "border-white/10 bg-white/5"
        } ${isExpanded ? "shadow-2xl shadow-red-600/10" : "shadow-lg shadow-black/50"}`}
      >
        {/* Header - Caixa Horizontal */}
        <button
          onClick={() => {
            // Só permitir expandir se NÃO estiver preenchido E (pode preencher OU está desbloqueado OU é formulário 1)
            // Formulários preenchidos NÃO podem ser expandidos
            if (!isPreenchido && (form.pode_preencher || form.desbloqueado || form.formulario_numero === 1)) {
              setExpandedForm(isExpanded ? null : form.formulario_numero);
            }
          }}
          disabled={isPreenchido || (!form.pode_preencher && !form.desbloqueado && form.formulario_numero !== 1)}
          className={`w-full p-4 md:p-6 flex items-center justify-between transition-all duration-200 ${
            isPreenchido
              ? "cursor-not-allowed opacity-60"
              : form.pode_preencher || form.desbloqueado || form.formulario_numero === 1
              ? "hover:bg-white/5 cursor-pointer"
              : "cursor-not-allowed opacity-40"
          }`}
        >
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl font-black flex-shrink-0 ${
                isPreenchido
                  ? "bg-white/10 text-white border border-white/20"
                  : form.pode_preencher
                  ? "bg-red-600 text-white"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}
            >
              {form.formulario_numero}
            </div>
            <div className="flex-1 text-left min-w-0">
              <h3 className="text-base md:text-lg font-black text-white mb-1.5 truncate">
                Formulário #{form.formulario_numero}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge({ ...form, preenchido: isPreenchido })}
                {form.data_preenchimento && (
                  <span className="text-xs text-white/50">
                    {new Date(form.data_preenchimento).toLocaleDateString("pt-BR")}
                  </span>
                )}
                {!isPreenchido && form.data_desbloqueio && (
                  <span className="text-xs text-white/50">
                    {form.desbloqueado
                      ? new Date(form.data_desbloqueio).toLocaleDateString("pt-BR")
                      : "Desbloqueia " + new Date(form.data_desbloqueio).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {isPreenchido && (
              <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white/10 text-white border border-white/20">
                ✅ Preenchido
              </span>
            )}
            {!isPreenchido && (form.pode_preencher || form.desbloqueado || form.formulario_numero === 1) && (
              <svg
                className={`w-5 h-5 md:w-6 md:h-6 text-white/60 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </button>

        {/* Content - Expande Verticalmente */}
        {/* Só mostrar conteúdo se NÃO estiver preenchido E estiver expandido */}
        {isExpanded && !isPreenchido && (
          <div className="border-t border-white/10 bg-black p-4 md:p-6 space-y-6 animate-fade-in">
            {messages[form.formulario_numero] && (
              <div
                className={`p-4 rounded-xl border ${
                  messages[form.formulario_numero].includes("✅")
                    ? "bg-white/5 border-white/20 text-white"
                    : "bg-red-600/10 border-red-600/30 text-red-400"
                }`}
              >
                <p className="font-semibold">{messages[form.formulario_numero]}</p>
              </div>
            )}

            {canEdit ? (
              <div className="space-y-6">
                {/* Hidratação */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Hidratação</h4>
                  <p className="text-sm text-white/70 mb-3">Por semana eu bebi diariamente:</p>
                  <div className="flex flex-wrap gap-3">
                    {["2L", "3L", "4L", "5L"].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`hidratacao_${form.formulario_numero}`}
                          checked={data.hidratacao === opcao}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              [form.formulario_numero]: { ...prev[form.formulario_numero], hidratacao: opcao },
                            }))
                          }
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-white">{opcao} diariamente</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Treino por dia */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Treino por dia</h4>
                  <div className="space-y-3">
                    {DIAS_SEMANA.map((dia) => (
                      <div key={dia} className="flex items-center gap-4">
                        <span className="w-24 text-sm font-semibold text-white/90">{dia}</span>
                        <div className="flex flex-wrap gap-2">
                          {PERCENTUAIS.map((perc) => (
                            <label key={perc} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`treino_${form.formulario_numero}_${dia}`}
                                checked={data.treino_dias[dia] === perc}
                                onChange={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    [form.formulario_numero]: {
                                      ...prev[form.formulario_numero],
                                      treino_dias: { ...prev[form.formulario_numero].treino_dias, [dia]: perc },
                                    },
                                  }))
                                }
                                className="w-4 h-4 text-red-600"
                              />
                              <span className="text-sm text-white">{perc}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance de treino */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Performance de treino</h4>
                  <p className="text-sm text-white/70 mb-4">Marque o que você treinou:</p>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(EXERCICIOS).map(([grupo, exercicios]) => (
                      <div key={grupo}>
                        <h5 className="font-black text-red-500 uppercase tracking-wide text-xs mb-2">{grupo}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {exercicios.map((exercicio) => (
                            <label
                              key={exercicio}
                              className="flex items-center gap-2 cursor-pointer hover:bg-black p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={data.exercicios_realizados.includes(exercicio)}
                                onChange={() => toggleExercicio(form.formulario_numero, exercicio)}
                                className="w-4 h-4 text-red-600 rounded"
                              />
                              <span className="text-sm text-white">{exercicio}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sono */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Registro de sono</h4>
                  <p className="text-sm text-white/70 mb-3">Quantas horas em média dormiu?</p>
                  <div className="flex flex-wrap gap-3">
                    {["6h", "7h", "8h", "9h", "10h"].map((horas) => (
                      <label key={horas} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`sono_${form.formulario_numero}`}
                          checked={data.horas_sono === horas}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              [form.formulario_numero]: { ...prev[form.formulario_numero], horas_sono: horas },
                            }))
                          }
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-white">{horas} por dia</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Peso */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Peso atual</h4>
                  <input
                    type="number"
                    step="0.1"
                    value={data.peso_atual}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [form.formulario_numero]: { ...prev[form.formulario_numero], peso_atual: e.target.value },
                      }))
                    }
                    placeholder="Ex: 75.5"
                    className="w-full md:w-64 p-3 rounded-xl border border-white/20 bg-black text-white focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                  <p className="text-xs text-white/50 mt-2">Informe em kg (ex: 75.5)</p>
                </div>

                {/* Desafios */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">
                    Desafio, conquistas e humor <span className="text-sm text-white/50">(OPCIONAL)</span>
                  </h4>
                  <textarea
                    value={data.desafios_conquistas}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [form.formulario_numero]: {
                          ...prev[form.formulario_numero],
                          desafios_conquistas: e.target.value,
                        },
                      }))
                    }
                    placeholder="Compartilhe seus desafios, conquistas e como se sentiu..."
                    rows={4}
                    className="w-full p-3 rounded-xl border border-white/20 bg-black text-white focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>

                {/* Botão enviar */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => handleSubmit(form.formulario_numero)}
                    disabled={submitting[form.formulario_numero]}
                    className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {submitting[form.formulario_numero] ? "Enviando..." : "ENVIAR FORMULÁRIO"}
                  </button>
                </div>
              </div>
            ) : form.formulario_numero === 1 ? (
              // Formulário 1 sempre deve ser editável se não estiver preenchido
              <div className="space-y-6">
                {/* Hidratação */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Hidratação</h4>
                  <p className="text-sm text-white/70 mb-3">Por semana eu bebi diariamente:</p>
                  <div className="flex flex-wrap gap-3">
                    {["2L", "3L", "4L", "5L"].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`hidratacao_${form.formulario_numero}`}
                          checked={data.hidratacao === opcao}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              [form.formulario_numero]: { ...prev[form.formulario_numero], hidratacao: opcao },
                            }))
                          }
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-white">{opcao} diariamente</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Treino por dia */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Treino por dia</h4>
                  <div className="space-y-3">
                    {DIAS_SEMANA.map((dia) => (
                      <div key={dia} className="flex items-center gap-4">
                        <span className="w-24 text-sm font-semibold text-white/90">{dia}</span>
                        <div className="flex flex-wrap gap-2">
                          {PERCENTUAIS.map((perc) => (
                            <label key={perc} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`treino_${form.formulario_numero}_${dia}`}
                                checked={data.treino_dias[dia] === perc}
                                onChange={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    [form.formulario_numero]: {
                                      ...prev[form.formulario_numero],
                                      treino_dias: { ...prev[form.formulario_numero].treino_dias, [dia]: perc },
                                    },
                                  }))
                                }
                                className="w-4 h-4 text-red-600"
                              />
                              <span className="text-sm text-white">{perc}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance de treino */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Performance de treino</h4>
                  <p className="text-sm text-white/70 mb-4">Marque o que você treinou:</p>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(EXERCICIOS).map(([grupo, exercicios]) => (
                      <div key={grupo}>
                        <h5 className="font-black text-red-500 uppercase tracking-wide text-xs mb-2">{grupo}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {exercicios.map((exercicio) => (
                            <label
                              key={exercicio}
                              className="flex items-center gap-2 cursor-pointer hover:bg-black p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={data.exercicios_realizados.includes(exercicio)}
                                onChange={() => toggleExercicio(form.formulario_numero, exercicio)}
                                className="w-4 h-4 text-red-600 rounded"
                              />
                              <span className="text-sm text-white">{exercicio}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sono */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Registro de sono</h4>
                  <p className="text-sm text-white/70 mb-3">Quantas horas em média dormiu?</p>
                  <div className="flex flex-wrap gap-3">
                    {["6h", "7h", "8h", "9h", "10h"].map((horas) => (
                      <label key={horas} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`sono_${form.formulario_numero}`}
                          checked={data.horas_sono === horas}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              [form.formulario_numero]: { ...prev[form.formulario_numero], horas_sono: horas },
                            }))
                          }
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-white">{horas} por dia</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Peso */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">Peso atual</h4>
                  <input
                    type="number"
                    step="0.1"
                    value={data.peso_atual}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [form.formulario_numero]: { ...prev[form.formulario_numero], peso_atual: e.target.value },
                      }))
                    }
                    placeholder="Ex: 75.5"
                    className="w-full md:w-64 p-3 rounded-xl border border-white/20 bg-black text-white focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                  <p className="text-xs text-white/50 mt-2">Informe em kg (ex: 75.5)</p>
                </div>

                {/* Desafios */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="font-black text-white uppercase tracking-wide text-sm mb-3">
                    Desafio, conquistas e humor <span className="text-sm text-white/50">(OPCIONAL)</span>
                  </h4>
                  <textarea
                    value={data.desafios_conquistas}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [form.formulario_numero]: {
                          ...prev[form.formulario_numero],
                          desafios_conquistas: e.target.value,
                        },
                      }))
                    }
                    placeholder="Compartilhe seus desafios, conquistas e como se sentiu..."
                    rows={4}
                    className="w-full p-3 rounded-xl border border-white/20 bg-black text-white focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>

                {/* Botão enviar */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => handleSubmit(form.formulario_numero)}
                    disabled={submitting[form.formulario_numero]}
                    className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {submitting[form.formulario_numero] ? "Enviando..." : "ENVIAR FORMULÁRIO"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/70 mb-2">⏳ Este formulário ainda não está disponível.</p>
                {form.data_desbloqueio && (
                  <p className="text-sm text-white/50">
                    Será desbloqueado em {new Date(form.data_desbloqueio).toLocaleDateString("pt-BR")}
                  </p>
                )}
                {form.formulario_numero > 1 && (
                  <p className="text-xs text-zinc-600 mt-2">
                    Complete o formulário anterior para desbloquear este.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/70">Carregando formulários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-black mb-3 text-white tracking-tight">
          Acompanhamento de Progresso
        </h1>
        <p className="text-white/60 text-sm md:text-base">
          Complete os 4 formulários de acompanhamento durante seu período de acesso
        </p>
      </div>

      {/* Gráficos de Performance */}
      {userId && (
        <div className="mb-8">
          <ProgressCharts userId={userId} refreshKey={chartsRefreshKey} />
        </div>
      )}

      <div className="space-y-4">
        {formularios.length > 0 ? (
          formularios.map((form) => renderFormulario(form))
        ) : (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-12 h-12 border-4 border-white/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70 mb-4">Carregando formulários...</p>
            <p className="text-sm text-white/50">Se os formulários não aparecerem, verifique o console do navegador para mais detalhes.</p>
          </div>
        )}
      </div>

      {/* Área de Orientações Expert */}
      <div className="mt-8 md:mt-12">
        <div
          className={`bg-black border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
            mensagensNaoLidas > 0
              ? "border-red-600/50 hover:border-red-600 bg-white/5"
              : "border-white/10 bg-white/5"
          } ${orientacoesExpanded ? "shadow-2xl shadow-red-600/10" : "shadow-lg shadow-black/50"}`}
        >
          {/* Header - Caixa Horizontal */}
          <button
            onClick={() => setOrientacoesExpanded(!orientacoesExpanded)}
            className="w-full p-4 md:p-6 flex items-center justify-between transition-all duration-200 hover:bg-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl font-black flex-shrink-0 ${
                  mensagensNaoLidas > 0
                    ? "bg-red-600 text-white"
                    : "bg-white/10 text-white/60 border border-white/20"
                }`}
              >
                💬
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-base md:text-lg font-black text-white mb-1.5">
                  Orientações Expert
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {mensagensNaoLidas > 0 ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-red-600 text-white border border-red-700">
                      Nova Mensagem
                    </span>
                  ) : orientacoes.length > 0 ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white/10 text-white/70 border border-white/20">
                      {orientacoes.length} {orientacoes.length === 1 ? "mensagem" : "mensagens"}
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-white/10 text-white/70 border border-white/20">
                      Nenhuma mensagem
                    </span>
                  )}
                </div>
              </div>
            </div>
            <svg
              className={`w-5 h-5 md:w-6 md:h-6 text-white/60 transition-transform duration-300 flex-shrink-0 ${
                orientacoesExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Content - Expande Verticalmente */}
          {orientacoesExpanded && (
            <div className="border-t border-white/10 bg-black p-4 md:p-6 space-y-4 animate-fade-in">
              {orientacoesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-white/70">Carregando orientações...</p>
                </div>
              ) : orientacoes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">Nenhuma orientação disponível no momento.</p>
                  <p className="text-sm text-white/50 mt-2">
                    O administrador enviará orientações personalizadas para você aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orientacoes.map((orientacao) => (
                    <div
                      key={orientacao.id}
                      className={`bg-white/5 border-2 rounded-xl p-4 md:p-5 ${
                        !orientacao.lido
                          ? "border-red-600/50 bg-red-600/10"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-black text-red-500 uppercase tracking-wide">
                              Expert
                            </span>
                            <span className="text-xs text-white/50">
                              {new Date(orientacao.enviado_em).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {orientacao.lido && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wide bg-white/10 text-white border border-white/20">
                                ✓ Lido
                              </span>
                            )}
                          </div>
                          <p className="text-white whitespace-pre-wrap leading-relaxed">{orientacao.mensagem}</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => confirmarLeitura(orientacao.id)}
                          disabled={orientacao.lido}
                          className={`px-4 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all ${
                            orientacao.lido
                              ? "bg-white/5 text-white/40 cursor-not-allowed border border-white/10"
                              : "bg-red-600 hover:bg-red-700 text-white border border-red-700"
                          }`}
                        >
                          {orientacao.lido ? "✓ Confirmado" : "Confirmar leitura"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product Grid Section */}
      <div className="mt-8 md:mt-12">
        <div className="grid grid-cols-3 gap-4 md:gap-6">
          {/* Diuriefit Product */}
          <div
            onClick={() => navigate("/dashboard/diuriefit")}
            className="cursor-pointer group overflow-hidden rounded-xl border-2 border-white/10 hover:border-red-600/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-600/20"
          >
            <img
              src="/frente-diuriefit.png"
              alt="Diuriefit"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Detoba Product */}
          <div
            onClick={() => navigate("/dashboard/detoba")}
            className="cursor-pointer group overflow-hidden rounded-xl border-2 border-white/10 hover:border-red-600/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-600/20"
          >
            <img
              src="/frente-detoba.png"
              alt="Detoba"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Blofa Product */}
          <div
            onClick={() => navigate("/dashboard/blofa")}
            className="cursor-pointer group overflow-hidden rounded-xl border-2 border-white/10 hover:border-red-600/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-600/20"
          >
            <img
              src="/frente-blofa2.png"
              alt="Blofa"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
