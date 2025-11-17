import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type AcompanhamentoData = {
  id: string;
  formulario_numero: number;
  data_preenchimento: string;
  hidratacao: string | null;
  horas_sono: string | null;
  peso_atual: number | null;
  exercicios_realizados: string[] | null;
  treino_dias: Record<string, string> | null;
};

type ChartData = {
  data: string;
  dataCompleta: string;
  formulario: string;
  formulario_numero: number;
  peso: number | null;
  hidratacao: number;
  sono: number;
  exercicios: number;
  treino_media: number;
};

interface ProgressChartsProps {
  userId: string;
  isAdmin?: boolean;
  refreshKey?: number; // Chave para forçar atualização
}

const ProgressCharts = ({ userId, isAdmin = false, refreshKey = 0 }: ProgressChartsProps) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const loadChartData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setHasData(false);
      setData([]);
      return;
    }

    try {
      setLoading(true);
      
      const query = supabase
        .from("acompanhamento_semanal")
        .select("*")
        .eq("user_id", userId)
        .not("data_preenchimento", "is", null)
        .order("data_preenchimento", { ascending: true });
      
      const { data: acompanhamentos, error } = await query;

      if (error) {
        console.error("Erro ao carregar dados para gráficos:", error);
        setHasData(false);
        setData([]);
        setLoading(false);
        return;
      }

      if (!acompanhamentos || acompanhamentos.length === 0) {
        setHasData(false);
        setData([]);
        setLoading(false);
        return;
      }

      // Processar dados para os gráficos
      const processedData: ChartData[] = acompanhamentos.map((item: AcompanhamentoData) => {
        // Converter hidratação para número (2L -> 2, 3L -> 3, etc)
        const hidratacaoNum = item.hidratacao ? parseInt(item.hidratacao.replace("L", "")) : 0;

        // Converter sono para número (6h -> 6, 7h -> 7, etc)
        const sonoNum = item.horas_sono ? parseInt(item.horas_sono.replace("h", "")) : 0;

        // Contar exercícios realizados
        const exerciciosCount = item.exercicios_realizados?.length || 0;

        // Calcular média de treino (%)
        let treinoMedia = 0;
        if (item.treino_dias) {
          // treino_dias pode ser um objeto JSON ou string JSON
          let treinoDiasObj: Record<string, string> = {};
          if (typeof item.treino_dias === 'string') {
            try {
              treinoDiasObj = JSON.parse(item.treino_dias);
            } catch {
              treinoDiasObj = {};
            }
          } else if (typeof item.treino_dias === 'object') {
            treinoDiasObj = item.treino_dias as Record<string, string>;
          }
          
          const dias = Object.values(treinoDiasObj);
          const soma = dias.reduce((acc, val) => {
            if (typeof val === 'string') {
              if (val === "100%" || val === "100") return acc + 100;
              if (val === "75%" || val === "75") return acc + 75;
              if (val === "50%" || val === "50") return acc + 50;
              if (val === "Não treinei" || val === "não treinei") return acc;
            }
            return acc;
          }, 0);
          treinoMedia = dias.length > 0 ? Math.round(soma / dias.length) : 0;
        }

        // Formatar data para exibição
        const dataObj = new Date(item.data_preenchimento);
        const dataFormatada = dataObj.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        
        // Formato curto para o eixo X (Form #1, Form #2, etc)
        const formularioLabel = `Form #${item.formulario_numero}`;
        
        // Data completa para tooltip
        const dataCompleta = dataObj.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        return {
          data: dataFormatada,
          dataCompleta: dataCompleta,
          formulario: formularioLabel,
          formulario_numero: item.formulario_numero,
          peso: item.peso_atual,
          hidratacao: hidratacaoNum,
          sono: sonoNum,
          exercicios: exerciciosCount,
          treino_media: treinoMedia,
        };
      });

      setData(processedData);
      setHasData(processedData.length > 0);
    } catch (err) {
      console.error("Erro ao processar dados:", err);
      setHasData(false);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setHasData(false);
      setData([]);
      return;
    }
    
    loadChartData();
  }, [userId, refreshKey, loadChartData]);
  
  // Recarregar dados periodicamente (a cada 30 segundos) para pegar novos formulários
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      loadChartData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId, loadChartData]);

  // Cores customizadas
  const colors = {
    primary: "#dc2626", // red-600
    secondary: "#ef4444", // red-500
    accent: "#f87171", // red-400
    grid: "rgba(255, 255, 255, 0.1)",
    text: "rgba(255, 255, 255, 0.9)",
    textSecondary: "rgba(255, 255, 255, 0.6)",
  };

  // Componente customizado para Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Buscar data completa do item
      const dataItem = data.find((d) => d.formulario === label);
      const dataCompleta = dataItem?.dataCompleta || label;
      
      return (
        <div className="bg-black border border-white/20 rounded-lg p-2 shadow-xl backdrop-blur-sm">
          <p className="text-white font-black mb-1 text-xs uppercase tracking-wide">{dataCompleta}</p>
          <p className="text-white/70 text-xs mb-1">{label}</p>
          <div className="space-y-0.5">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-xs font-bold" style={{ color: entry.color }}>
                {entry.name}: <span className="text-white">{entry.value}</span>
                {(entry.name === "Peso (kg)" || entry.name === "Peso") && " kg"}
                {(entry.name === "Hidratação (L)" || entry.name === "Hidratação") && " L"}
                {(entry.name === "Sono (h)" || entry.name === "Sono") && " h"}
                {(entry.name === "Exercícios" || entry.name === "exercicios") && " exercícios"}
                {(entry.name === "Treino (%)" || entry.name === "Treino") && "%"}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-center py-8">
          <div className="w-10 h-10 border-4 border-white/20 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="text-lg md:text-xl font-black text-white mb-3 uppercase tracking-wide">
          Gráficos de Performance
        </h2>
        <div className="text-center py-8">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-white/70 text-base font-bold mb-2">
            Ainda não há dados para visualizar
          </p>
          <p className="text-white/50 text-xs md:text-sm">
            Preencha seus formulários de acompanhamento para ver seus gráficos de performance aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 space-y-3 md:space-y-4">
      <h2 className="text-lg md:text-xl font-black text-white mb-3 md:mb-4 uppercase tracking-wide">
        Gráficos de Performance
      </h2>

      {/* Grid compacto: 2 colunas no desktop, 1 no mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Evolução do Peso - Ocupa 2 colunas se existir */}
        {data.some((d) => d.peso !== null && d.peso > 0) && (
          <div className="md:col-span-2 bg-black/50 border border-white/10 rounded-lg p-3">
            <h3 className="text-sm md:text-base font-black text-white mb-2 uppercase tracking-wide">
              Evolução do Peso (kg)
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="formulario"
                  stroke={colors.textSecondary}
                  style={{ fontSize: "9px", fontWeight: "bold" }}
                  tick={{ fill: colors.textSecondary }}
                />
                <YAxis
                  stroke={colors.textSecondary}
                  style={{ fontSize: "9px" }}
                  tick={{ fill: colors.textSecondary }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: colors.textSecondary, fontSize: "10px", paddingTop: "5px" }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke={colors.primary}
                  strokeWidth={2}
                  dot={{ fill: colors.primary, r: 4, strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                  name="Peso (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Hidratação */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-3">
          <h3 className="text-sm md:text-base font-black text-white mb-2 uppercase tracking-wide">
            Hidratação (L)
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="formulario"
                stroke={colors.textSecondary}
                style={{ fontSize: "9px", fontWeight: "bold" }}
                tick={{ fill: colors.textSecondary }}
              />
              <YAxis
                stroke={colors.textSecondary}
                style={{ fontSize: "9px" }}
                tick={{ fill: colors.textSecondary }}
                domain={[0, 5]}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="hidratacao" 
                fill={colors.primary} 
                name="Hidratação (L)" 
                radius={[6, 6, 0, 0]}
                stroke={colors.primary}
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sono */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-3">
          <h3 className="text-sm md:text-base font-black text-white mb-2 uppercase tracking-wide">
            Sono (h)
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="formulario"
                stroke={colors.textSecondary}
                style={{ fontSize: "9px", fontWeight: "bold" }}
                tick={{ fill: colors.textSecondary }}
              />
              <YAxis
                stroke={colors.textSecondary}
                style={{ fontSize: "9px" }}
                tick={{ fill: colors.textSecondary }}
                domain={[0, 10]}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="sono" 
                fill={colors.secondary} 
                name="Sono (h)" 
                radius={[6, 6, 0, 0]}
                stroke={colors.secondary}
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance de Treino */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-3">
          <h3 className="text-sm md:text-base font-black text-white mb-2 uppercase tracking-wide">
            Treino (%)
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorTreino" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="formulario"
                stroke={colors.textSecondary}
                style={{ fontSize: "9px", fontWeight: "bold" }}
                tick={{ fill: colors.textSecondary }}
              />
              <YAxis
                stroke={colors.textSecondary}
                style={{ fontSize: "9px" }}
                tick={{ fill: colors.textSecondary }}
                domain={[0, 100]}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="treino_media"
                stroke={colors.primary}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTreino)"
                name="Treino (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Exercícios Realizados */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-3">
          <h3 className="text-sm md:text-base font-black text-white mb-2 uppercase tracking-wide">
            Exercícios
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="formulario"
                stroke={colors.textSecondary}
                style={{ fontSize: "9px", fontWeight: "bold" }}
                tick={{ fill: colors.textSecondary }}
              />
              <YAxis
                stroke={colors.textSecondary}
                style={{ fontSize: "9px" }}
                tick={{ fill: colors.textSecondary }}
                domain={[0, 'dataMax + 5']}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="exercicios" 
                fill={colors.accent} 
                name="Exercícios" 
                radius={[6, 6, 0, 0]}
                stroke={colors.accent}
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgressCharts;

