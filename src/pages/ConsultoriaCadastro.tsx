import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

type PatologiasKey =
  | "dor_de_cabeca"
  | "insonia"
  | "dor_de_garganta"
  | "aftas"
  | "acne"
  | "perda_de_cabelo"
  | "suor_excessivo"
  | "asma_bronquite"
  | "nauseas_vomito"
  | "diarreia"
  | "constipacao"
  | "azia"
  | "dor_muscular"
  | "dor_articular"
  | "fadiga"
  | "hiperatividade"
  | "ansiedade"
  | "depressao"
  | "frequentemente_doente";

const patologiasLabels: Record<PatologiasKey, string> = {
  dor_de_cabeca: "Dor de cabeça",
  insonia: "Insônia",
  dor_de_garganta: "Dor de garganta",
  aftas: "Aftas",
  acne: "Acne",
  perda_de_cabelo: "Perda de cabelo",
  suor_excessivo: "Suor excessivo",
  asma_bronquite: "Asma ou bronquite",
  nauseas_vomito: "Náuseas, vômito",
  diarreia: "Diarréia",
  constipacao: "Constipação",
  azia: "Azia",
  dor_muscular: "Dor muscular (não induzida por exercício)",
  dor_articular: "Dor Articular (não induzida por exercício)",
  fadiga: "Fadiga",
  hiperatividade: "Hiperatividade",
  ansiedade: "Ansiedade",
  depressao: "Depressão",
  frequentemente_doente: "Frequentemente doente",
};

const optionsFrequencia = ["Nunca", "Raramente", "Ocasionalmente", "Frequentemente"] as const;

const initialPatologias: Record<PatologiasKey, typeof optionsFrequencia[number]> = Object.keys(
  patologiasLabels,
).reduce((acc, key) => {
  acc[key as PatologiasKey] = "Nunca";
  return acc;
}, {} as any);

const ConsultoriaCadastro = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const MAX_STEPS = 14;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingCadastroId, setExistingCadastroId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState<any>({
    // Etapa 1
    email: "",
    // Etapa 2
    nome_completo: "",
    plano_contratado: "",
    data_nascimento: "",
    // Etapa 3
    telefone: "",
    cpf: "",
    estado: "",
    endereco_completo: "",
    // Etapa 4
    objetivo: "",
    altura_metros: "",
    peso_atual: "",
    alteracao_peso_detalhes: "",
    // Etapa 5
    ocupacao: "",
    renda_per_capita: "",
    // Etapa 6
    patologias: initialPatologias,
    // Etapa 7
    sintomas_adicionais: "",
    quem_cozinha: "",
    mora_com_quantos: "",
    escala_bristol: "",
    // Etapa 7 (arquivos)
    foto_frente: null as File | null,
    foto_costas: null as File | null,
    foto_lado: null as File | null,
    foto_video_livre: null as File | null,
    // Etapa 8 - Informações de Treino
    exercicio_fisico_pratica: "",
    tempo_pratica_esporte: "",
    tipo_academia: "",
    horario_treino: "",
    // Etapa 9 - Detalhes de Treino
    musculatura_segundo_enfoque: "",
    divisao_treino_atual: "",
    exercicios_series_detalhes: "",
    limitacao_desconforto_articular: "",
    uso_esteroides: "",
    outros_esportes: "",
    // Etapa 10 - Maquinário da Academia
    aparelhos_costas: [] as string[],
    aparelhos_peito: [] as string[],
    frequencia_pratica: "",
    tempo_disponivel_treino: "",
    // Etapa 11 - Máquinas de Deltoide e Membros Inferiores
    aparelhos_deltoide: [] as string[],
    aparelhos_membros_inferiores: [] as string[],
    maquinas_faltando: "",
    // Etapa 12 - Hábitos de Vida
    qualidade_sono_escala: "",
    horas_sono_noite: "",
    observacao_sono: "",
    fuma_frequencia: "",
    bebidas_alcoolicas_frequencia: "",
    // Etapa 13 - Rotina Segunda-feira
    rotina_segunda: "",
    // Etapa 14 - Rotina Terça, Quarta e Quinta
    rotina_terca: "",
    rotina_quarta: "",
    rotina_quinta: "",
  });

  // Caminho público para a imagem do modelo (arquivo com espaços e vírgulas no nome)
  // Como o arquivo está em /public, referenciamos a URL raiz e codificamos o caminho.
  const modeloFotos = encodeURI("/Modelo de envio de foto 1, 2 e 3.png");

  // Verificar se usuário está autenticado e carregar dados
  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user) {
        setIsAuthenticated(true);
        setUserId(session.session.user.id);
        
        // Preencher email automaticamente
        setFormData((prev) => ({
          ...prev,
          email: session.session.user.email || "",
        }));

        // Verificar se já existe registro para este usuário
        const { data: existing } = await supabase
          .from("consultoria_cadastros")
          .select("id, email, nome_completo, plano_contratado, data_nascimento, telefone, cpf, estado, endereco_completo, objetivo, altura_metros, peso_atual, alteracao_peso_detalhes, ocupacao, renda_per_capita, patologias, sintomas_adicionais, quem_cozinha, mora_com_quantos, escala_bristol, exercicio_fisico_pratica, tempo_pratica_esporte, tipo_academia, horario_treino, musculatura_segundo_enfoque, divisao_treino_atual, exercicios_series_detalhes, limitacao_desconforto_articular, uso_esteroides, outros_esportes, aparelhos_costas, aparelhos_peito, frequencia_pratica, tempo_disponivel_treino, aparelhos_deltoide, aparelhos_membros_inferiores, maquinas_faltando, qualidade_sono_escala, horas_sono_noite, observacao_sono, fuma_frequencia, bebidas_alcoolicas_frequencia, rotina_segunda, rotina_terca, rotina_quarta, rotina_quinta")
          .eq("user_id", session.session.user.id)
          .maybeSingle();

        if (existing) {
          setExistingCadastroId(existing.id);
          // Preencher formulário com dados existentes
          setFormData((prev) => ({
            ...prev,
            email: existing.email || session.session.user.email || "",
            nome_completo: existing.nome_completo || "",
            plano_contratado: existing.plano_contratado || "",
            data_nascimento: existing.data_nascimento || "",
            telefone: existing.telefone || "",
            cpf: existing.cpf || "",
            estado: existing.estado || "",
            endereco_completo: existing.endereco_completo || "",
            objetivo: existing.objetivo || "",
            altura_metros: existing.altura_metros || "",
            peso_atual: existing.peso_atual || "",
            alteracao_peso_detalhes: existing.alteracao_peso_detalhes || "",
            ocupacao: existing.ocupacao || "",
            renda_per_capita: existing.renda_per_capita || "",
            patologias: existing.patologias || initialPatologias,
            sintomas_adicionais: existing.sintomas_adicionais || "",
            quem_cozinha: existing.quem_cozinha || "",
            mora_com_quantos: existing.mora_com_quantos || "",
            escala_bristol: existing.escala_bristol || "",
            exercicio_fisico_pratica: existing.exercicio_fisico_pratica || "",
            tempo_pratica_esporte: existing.tempo_pratica_esporte || "",
            tipo_academia: existing.tipo_academia || "",
            horario_treino: existing.horario_treino || "",
            musculatura_segundo_enfoque: existing.musculatura_segundo_enfoque || "",
            divisao_treino_atual: existing.divisao_treino_atual || "",
            exercicios_series_detalhes: existing.exercicios_series_detalhes || "",
            limitacao_desconforto_articular: existing.limitacao_desconforto_articular || "",
            uso_esteroides: existing.uso_esteroides || "",
            outros_esportes: existing.outros_esportes || "",
            aparelhos_costas: existing.aparelhos_costas || [],
            aparelhos_peito: existing.aparelhos_peito || [],
            frequencia_pratica: existing.frequencia_pratica || "",
            tempo_disponivel_treino: existing.tempo_disponivel_treino || "",
            aparelhos_deltoide: existing.aparelhos_deltoide || [],
            aparelhos_membros_inferiores: existing.aparelhos_membros_inferiores || [],
            maquinas_faltando: existing.maquinas_faltando || "",
            qualidade_sono_escala: existing.qualidade_sono_escala || "",
            horas_sono_noite: existing.horas_sono_noite || "",
            observacao_sono: existing.observacao_sono || "",
            fuma_frequencia: existing.fuma_frequencia || "",
            bebidas_alcoolicas_frequencia: existing.bebidas_alcoolicas_frequencia || "",
            rotina_segunda: existing.rotina_segunda || "",
            rotina_terca: existing.rotina_terca || "",
            rotina_quarta: existing.rotina_quarta || "",
            rotina_quinta: existing.rotina_quinta || "",
          }));
        }
      }
    })();
  }, []);

  const setField = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const setPatologia = (key: PatologiasKey, value: (typeof optionsFrequencia)[number]) => {
    setFormData((prev: any) => ({
      ...prev,
      patologias: { ...prev.patologias, [key]: value },
    }));
  };

  const handleUploadIfAny = async (file: File | null, key: string) => {
    if (!file) return null;
    const sanitized = `${file.name}`.toLowerCase().replace(/[^a-z0-9_.-]/gi, "_");
    const filePath = `pre_cadastros/${Date.now()}_${sanitized}`;
    const { error: upErr } = await supabase.storage
      .from("fotos_clientes")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("fotos_clientes").getPublicUrl(filePath);
    return { key, url: data.publicUrl };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMsg(null);
    try {
      const filesToUpload = [
        { file: formData.foto_frente, key: "foto_frente_url" },
        { file: formData.foto_costas, key: "foto_costas_url" },
        { file: formData.foto_lado, key: "foto_lado_url" },
        { file: formData.foto_video_livre, key: "foto_video_livre_url" },
      ];

      const uploaded: Record<string, string> = {};
      for (const item of filesToUpload) {
        if (item.file) {
          const res = await handleUploadIfAny(item.file, item.key);
          if (res) uploaded[res.key] = res.url;
        }
      }

      const {
        foto_frente,
        foto_costas,
        foto_lado,
        foto_video_livre,
        ...withoutFiles
      } = formData;

      const finalData = { ...withoutFiles, ...uploaded };
      
      // Se usuário está autenticado, associar ao user_id e marcar como preenchido
      if (isAuthenticated && userId) {
        finalData.user_id = userId;
        finalData.form_preenchido = true;
        
        if (existingCadastroId) {
          // Atualizar registro existente
          const { error } = await supabase
            .from("consultoria_cadastros")
            .update(finalData)
            .eq("id", existingCadastroId);
          if (error) throw error;
        } else {
          // Criar novo registro com user_id
          const { error } = await supabase
            .from("consultoria_cadastros")
            .insert([finalData]);
          if (error) throw error;
        }
        
        setSuccessMsg("Formulário salvo com sucesso! Redirecionando para o dashboard...");
        // Redirecionar para dashboard após 2 segundos
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        // Usuário não autenticado (fluxo antigo - cadastro público)
        const { error } = await supabase.from("consultoria_cadastros").insert([finalData]);
        if (error) throw error;
        setSuccessMsg("Cadastro enviado com sucesso para análise!");
        // reset
        setFormData((prev: any) => ({ ...prev, ...{ ...initialPatologias }, patologias: initialPatologias }));
        setStep(1);
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Falha ao enviar cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIndicator = () => (
    <div className="text-sm text-white/60 mb-6 text-center uppercase tracking-wide">Etapa {step} de {MAX_STEPS}</div>
  );

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center text-white tracking-tight">PRÉ-CADASTRO CONSULTORIA</h1>
        <h2 className="text-2xl text-center text-red-500 mb-8 font-light tracking-wide">TEAM PB</h2>

        <StepIndicator />
        <form onSubmit={(e) => e.preventDefault()} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 hover:border-white/20 transition-all duration-300">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                placeholder="seu@email.com"
                disabled={isAuthenticated}
              />
              {isAuthenticated && (
                <p className="text-xs text-white/50">
                  Você está autenticado. Após preencher o formulário, os dados serão salvos no seu perfil.
                </p>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Nome completo</label>
              <input
                type="text"
                value={formData.nome_completo}
                onChange={(e) => setField("nome_completo", e.target.value)}
                className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                placeholder="Seu nome completo"
              />
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Plano contratado</label>
              <div className="flex gap-4 text-white/80">
                {["Dieta", "Treino", "Dieta + Treino"].map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="radio"
                      name="plano_contratado"
                      checked={formData.plano_contratado === opt}
                      onChange={() => setField("plano_contratado", opt)}
                      className="text-red-600 focus:ring-red-600"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Telefone (DDD)</label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setField("telefone", e.target.value)}
                className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                placeholder="(21) 9 9999-9999"
              />
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Estado</label>
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => setField("estado", e.target.value)}
                className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                placeholder="RJ"
              />
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Endereço completo</label>
              <input
                type="text"
                value={formData.endereco_completo}
                onChange={(e) => setField("endereco_completo", e.target.value)}
                className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                placeholder="CEP, Bairro, Rua, Número"
              />

              {/* ORIENTAÇÕES E ENVIO DE FOTOS (conforme exemplo) */}
              <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm">
                <div className="px-4 py-2 rounded-t-xl bg-red-600 text-white font-semibold text-sm">
                  ENVIO DE FOTOS E VÍDEOS
                </div>
                <div className="p-4 space-y-3 text-sm text-white/80">
                  <p>
                    Para que possamos juntos alinhar metas e objetivos, iremos analisar sua composição corporal.
                    Por esta razão, algumas fotos e vídeos precisam ser enviadas. Estas imagens irão diretamente
                    para a nossa equipe e apenas nós possuímos acesso a elas.
                  </p>
                  <p>
                    É importante tirar fotos do físico para que possamos analisar a composição corporal de forma
                    subjetiva e acompanhar os resultados. <strong className="text-white">Se não se sentir à vontade</strong> em enviar as fotos,
                    por favor, converse conosco!
                  </p>
                  <div>
                    <p className="font-semibold text-white">Vestimenta recomendada:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Homens: Sem camiseta, de sunga ou shorts de academia na altura da cintura.</li>
                      <li>Mulheres: Biquíni.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Dicas importantes:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Celular na altura do tronco.</li>
                      <li>Encontre uma boa iluminação.</li>
                      <li>Fique distante o suficiente para visualizar o corpo todo.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-white font-semibold">Modelo de envio de fotos 1, 2 e 3</h3>
                <img
                  src={modeloFotos}
                  alt="Modelo de envio de fotos 1, 2 e 3"
                  className="w-full rounded-xl border border-white/20"
                />
              </div>

              {[
                {
                  label:
                    "Foto de frente, braços colados ao corpo, sem contrair a musculatura. Certifique-se que é possível visualizar as coxas.",
                  key: "foto_frente",
                },
                {
                  label:
                    "Foto de costas, braços colados ao corpo, sem contrair a musculatura. Certifique-se que é possível visualizar as coxas.",
                  key: "foto_costas",
                },
                {
                  label:
                    "Foto de lado, braços levantados à frente ao corpo formando um ângulo de 90° em relação ao tronco.",
                  key: "foto_lado",
                },
                { label: "Foto/Vídeo livre (Não obrigatória)", key: "foto_video_livre" },
              ].map((f) => (
                <div key={f.key} className="space-y-2">
                  <label className="block text-sm text-white/80 font-semibold">{f.label}</label>
                  <input
                    type="file"
                    accept={f.key === "foto_video_livre" ? "image/*,video/*" : "image/*"}
                    onChange={(e) => setField(f.key, e.target.files?.[0] ?? null)}
                    className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:font-semibold hover:file:bg-red-700 file:cursor-pointer focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  />
                </div>
              ))}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Objetivo</label>
                <textarea
                  value={formData.objetivo}
                  onChange={(e) => setField("objetivo", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Altura (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.altura_metros}
                  onChange={(e) => setField("altura_metros", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Peso atual (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.peso_atual}
                  onChange={(e) => setField("peso_atual", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">
                  Alteração de peso recente (últimos 3 meses)? Explique.
                </label>
                <textarea
                  value={formData.alteracao_peso_detalhes}
                  onChange={(e) => setField("alteracao_peso_detalhes", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-4">
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Ocupação</label>
              <input
                type="text"
                value={formData.ocupacao}
                onChange={(e) => setField("ocupacao", e.target.value)}
                className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
              />
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Renda per capita</label>
              <div className="grid gap-2 text-white/80">
                {[
                  "Menos que um salário mínimo (R$1.518,00)",
                  "Dois salários mínimos (R$3.036,00)",
                  "Três salários mínimos (R$4.554,00)",
                  "Mais do que três salários mínimos",
                ].map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="radio"
                      name="renda_per_capita"
                      checked={formData.renda_per_capita === opt}
                      onChange={() => setField("renda_per_capita", opt)}
                      className="text-red-600 focus:ring-red-600"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white/80">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="p-2 font-semibold text-white">Sintoma</th>
                    {optionsFrequencia.map((opt) => (
                      <th key={opt} className="p-2 text-center font-semibold text-white">
                        {opt}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(patologiasLabels).map((key) => {
                    const k = key as PatologiasKey;
                    return (
                      <tr key={k} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                        <td className="p-2">{patologiasLabels[k]}</td>
                        {optionsFrequencia.map((opt) => (
                          <td key={opt} className="p-2 text-center">
                            <input
                              type="radio"
                              name={k}
                              checked={formData.patologias[k] === opt}
                              onChange={() => setPatologia(k, opt)}
                              className="text-red-600 focus:ring-red-600 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* STEP 7 */}
          {step === 7 && (
            <div className="space-y-4">
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Sintomas adicionais</label>
              <textarea
                value={formData.sintomas_adicionais}
                onChange={(e) => setField("sintomas_adicionais", e.target.value)}
                className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                rows={3}
              />
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Quem cozinha suas refeições?</label>
              <input
                type="text"
                value={formData.quem_cozinha}
                onChange={(e) => setField("quem_cozinha", e.target.value)}
                className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
              />
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Você mora com quantas pessoas? Parentesco?</label>
              <input
                type="text"
                value={formData.mora_com_quantos}
                onChange={(e) => setField("mora_com_quantos", e.target.value)}
                className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
              />
              <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide">Escala de Bristol</label>
              <div className="space-y-2">
                <img
                  src="/bristolform.png"
                  alt="Escala de Bristol"
                  className="w-full rounded-xl border border-white/20"
                />
                <div className="flex flex-wrap gap-4 text-white/80">
                  {["Tipo 1", "Tipo 2", "Tipo 3", "Tipo 4", "Tipo 5", "Tipo 6", "Tipo 7"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                      <input
                        type="radio"
                        name="escala_bristol"
                        checked={formData.escala_bristol === opt}
                        onChange={() => setField("escala_bristol", opt)}
                        className="text-red-600 focus:ring-red-600"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 8 - Informações de Treino */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4">
                <h3 className="text-red-400 font-bold text-lg mb-2">Coleta de dados de treinamento</h3>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Qual exercício físico você pratica? *
                </label>
                <input
                  type="text"
                  value={formData.exercicio_fisico_pratica}
                  onChange={(e) => setField("exercicio_fisico_pratica", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Há quanto tempo você pratica este esporte? *
                </label>
                <input
                  type="text"
                  value={formData.tempo_pratica_esporte}
                  onChange={(e) => setField("tempo_pratica_esporte", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-3">
                  Qual o tipo de academia que você frequenta? *
                </label>
                <div className="space-y-2 text-white/80">
                  {[
                    "Academia de bairro",
                    "Academia de rede",
                    "Centro de treinamento (CT)",
                  ].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                      <input
                        type="radio"
                        name="tipo_academia"
                        checked={formData.tipo_academia === opt}
                        onChange={() => setField("tipo_academia", opt)}
                        className="text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Qual horário você treina? *
                </label>
                <input
                  type="text"
                  value={formData.horario_treino}
                  onChange={(e) => setField("horario_treino", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-3">
                  Com que frequência você o pratica? *
                </label>
                <div className="space-y-2 text-white/80">
                  {[
                    "1x na semana",
                    "2x na semana",
                    "3x na semana",
                    "4x na semana",
                    "5x na semana",
                    "6x na semana",
                    "7x na semana",
                  ].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                      <input
                        type="radio"
                        name="frequencia_pratica"
                        checked={formData.frequencia_pratica === opt}
                        onChange={() => setField("frequencia_pratica", opt)}
                        className="text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Quanto tempo você tem disponível para praticar esse exercício físico dentro da sua rotina? *
                </label>
                <input
                  type="text"
                  value={formData.tempo_disponivel_treino}
                  onChange={(e) => setField("tempo_disponivel_treino", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  placeholder="Sua resposta"
                />
              </div>
            </div>
          )}

          {/* STEP 9 - Detalhes de Treino */}
          {step === 9 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Qual musculatura seria seu segundo maior enfoque em desenvolver atualmente? *
                </label>
                <input
                  type="text"
                  value={formData.musculatura_segundo_enfoque}
                  onChange={(e) => setField("musculatura_segundo_enfoque", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Caso você pratique musculação, qual sua divisão de treino atual? *
                </label>
                <input
                  type="text"
                  value={formData.divisao_treino_atual}
                  onChange={(e) => setField("divisao_treino_atual", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Dentro dessa divisão de treino, quais os exercícios e quantidade de séries de cada um deles? *
                </label>
                <textarea
                  value={formData.exercicios_series_detalhes}
                  onChange={(e) => setField("exercicios_series_detalhes", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={4}
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Você possui alguma limitação e/ou desconforto articular? Se sim, qual? *
                </label>
                <textarea
                  value={formData.limitacao_desconforto_articular}
                  onChange={(e) => setField("limitacao_desconforto_articular", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={3}
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Você fez/já fez uso de esteroides anabolizantes? Quais? Quais doses? *
                </label>
                <textarea
                  value={formData.uso_esteroides}
                  onChange={(e) => setField("uso_esteroides", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={3}
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Você pratica algum esporte além dos mencionados acima? Se sim, com que frequência e duração? *
                </label>
                <textarea
                  value={formData.outros_esportes}
                  onChange={(e) => setField("outros_esportes", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={3}
                  placeholder="Sua resposta"
                />
              </div>
            </div>
          )}

          {/* STEP 10 - Maquinário da Academia */}
          {step === 10 && (
            <div className="space-y-6">
              <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4">
                <h3 className="text-red-400 font-bold text-lg mb-2">Maquinário da academia</h3>
                <p className="text-white/70 text-sm">
                  Caso você não tenha optado pelo plano com treinamento incluso, não é necessário que preencha os campos abaixo. Pode pular para a próxima sessão.
                </p>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-3">
                  Quais aparelhos de costas você possui na sua academia?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Pullover Machine", img: "https://placehold.co/200x150/333/FFF?text=Pullover" },
                    { label: "T-Bar Row", img: "https://placehold.co/200x150/333/FFF?text=T-Bar" },
                    { label: "Remada Pronada e/ou neutra", img: "https://placehold.co/200x150/333/FFF?text=Remada+Pronada" },
                    { label: "Remada alta", img: "https://placehold.co/200x150/333/FFF?text=Remada+Alta" },
                    { label: "Remada baixa", img: "https://placehold.co/200x150/333/FFF?text=Remada+Baixa" },
                  ].map((aparelho) => (
                    <label
                      key={aparelho.label}
                      className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.aparelhos_costas.includes(aparelho.label)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setField("aparelhos_costas", [...formData.aparelhos_costas, aparelho.label]);
                          } else {
                            setField(
                              "aparelhos_costas",
                              formData.aparelhos_costas.filter((a: string) => a !== aparelho.label)
                            );
                          }
                        }}
                        className="mt-1 text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <div className="flex-1">
                        <img src={aparelho.img} alt={aparelho.label} className="w-full rounded-lg mb-2" />
                        <span className="text-white/80 text-sm">{aparelho.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-3">
                  Quais aparelhos de peito você tem na sua academia?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Supino reto máquina", img: "https://placehold.co/200x150/333/FFF?text=Supino+Reto" },
                    { label: "Supino declinado máquina", img: "https://placehold.co/200x150/333/FFF?text=Supino+Declinado" },
                    { label: "Supino reto deitado máquina", img: "https://placehold.co/200x150/333/FFF?text=Supino+Deitado" },
                    { label: "Supino inclinado máquina", img: "https://placehold.co/200x150/333/FFF?text=Supino+Inclinado" },
                    { label: "Chest Dips", img: "https://placehold.co/200x150/333/FFF?text=Chest+Dips" },
                  ].map((aparelho) => (
                    <label
                      key={aparelho.label}
                      className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.aparelhos_peito.includes(aparelho.label)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setField("aparelhos_peito", [...formData.aparelhos_peito, aparelho.label]);
                          } else {
                            setField(
                              "aparelhos_peito",
                              formData.aparelhos_peito.filter((a: string) => a !== aparelho.label)
                            );
                          }
                        }}
                        className="mt-1 text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <div className="flex-1">
                        <img src={aparelho.img} alt={aparelho.label} className="w-full rounded-lg mb-2" />
                        <span className="text-white/80 text-sm">{aparelho.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 11 - Máquinas de Deltoide e Membros Inferiores */}
          {step === 11 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-3">
                  Quais máquinas de deltoide você tem na sua academia?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Desenvolvimento máquina (bateria de pesos)", img: "https://placehold.co/200x150/333/FFF?text=Desenvolvimento+Bateria" },
                    { label: "Desenvolvimento máquina (plate loaded)", img: "https://placehold.co/200x150/333/FFF?text=Desenvolvimento+Plate" },
                    { label: "Elevação lateral máquina", img: "https://placehold.co/200x150/333/FFF?text=Elevacao+Lateral" },
                  ].map((aparelho) => (
                    <label
                      key={aparelho.label}
                      className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.aparelhos_deltoide.includes(aparelho.label)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setField("aparelhos_deltoide", [...formData.aparelhos_deltoide, aparelho.label]);
                          } else {
                            setField(
                              "aparelhos_deltoide",
                              formData.aparelhos_deltoide.filter((a: string) => a !== aparelho.label)
                            );
                          }
                        }}
                        className="mt-1 text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <div className="flex-1">
                        <img src={aparelho.img} alt={aparelho.label} className="w-full rounded-lg mb-2" />
                        <span className="text-white/80 text-sm">{aparelho.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-3">
                  Quais máquinas de membros inferiores você tem na sua academia?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Pendulum Squat", img: "https://placehold.co/200x150/333/FFF?text=Pendulum+Squat" },
                    { label: "Hack Squat", img: "https://placehold.co/200x150/333/FFF?text=Hack+Squat" },
                    { label: "Leg Press Horizontal", img: "https://placehold.co/200x150/333/FFF?text=Leg+Press" },
                    { label: "Elevação Pélvica", img: "https://placehold.co/200x150/333/FFF?text=Elevacao+Pelvica" },
                    { label: "Hip Press", img: "https://placehold.co/200x150/333/FFF?text=Hip+Press" },
                    { label: "Belt Squat", img: "https://placehold.co/200x150/333/FFF?text=Belt+Squat" },
                  ].map((aparelho) => (
                    <label
                      key={aparelho.label}
                      className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.aparelhos_membros_inferiores.includes(aparelho.label)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setField("aparelhos_membros_inferiores", [...formData.aparelhos_membros_inferiores, aparelho.label]);
                          } else {
                            setField(
                              "aparelhos_membros_inferiores",
                              formData.aparelhos_membros_inferiores.filter((a: string) => a !== aparelho.label)
                            );
                          }
                        }}
                        className="mt-1 text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <div className="flex-1">
                        <img src={aparelho.img} alt={aparelho.label} className="w-full rounded-lg mb-2" />
                        <span className="text-white/80 text-sm">{aparelho.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Faltou alguma máquina que você gostaria que estivesse no seu treinamento? Qual(is)?
                </label>
                <textarea
                  value={formData.maquinas_faltando}
                  onChange={(e) => setField("maquinas_faltando", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={3}
                  placeholder="Sua resposta"
                />
              </div>
            </div>
          )}

          {/* STEP 12 - Hábitos de Vida */}
          {step === 12 && (
            <div className="space-y-6">
              <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4">
                <h3 className="text-red-400 font-bold text-lg mb-2">Hábitos de vida</h3>
                <p className="text-white/70 text-sm">
                  Nesta seção busco saber algumas informações que indiretamente podem afetar sua saúde e diretamente intervir na montagem do seu plano alimentar.
                </p>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-3">
                  Em uma escala de 0-10, quão reparador é o seu sono em média? *
                </label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setField("qualidade_sono_escala", num.toString())}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        formData.qualidade_sono_escala === num.toString()
                          ? "border-red-600 bg-red-600 text-white scale-110"
                          : "border-white/20 bg-black/50 text-white/60 hover:border-red-600/50 hover:bg-red-600/10"
                      }`}
                    >
                      <div className="text-2xl">⭐</div>
                      <div className="text-xs font-bold mt-1">{num}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Quantas horas, em média, você dorme por noite? *
                </label>
                <input
                  type="text"
                  value={formData.horas_sono_noite}
                  onChange={(e) => setField("horas_sono_noite", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Alguma observação pertinente ao seu sono que queira adicionar? *
                </label>
                <textarea
                  value={formData.observacao_sono}
                  onChange={(e) => setField("observacao_sono", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={3}
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Você fuma? Se sim, com que frequência? *
                </label>
                <textarea
                  value={formData.fuma_frequencia}
                  onChange={(e) => setField("fuma_frequencia", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={3}
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Você consome bebidas alcoólicas? Se sim, com que frequência? *
                </label>
                <textarea
                  value={formData.bebidas_alcoolicas_frequencia}
                  onChange={(e) => setField("bebidas_alcoolicas_frequencia", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={3}
                  placeholder="Sua resposta"
                />
              </div>
            </div>
          )}

          {/* STEP 13 - Rotina Segunda-feira */}
          {step === 13 && (
            <div className="space-y-6">
              <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4">
                <h3 className="text-red-400 font-bold text-lg mb-2">Rotina</h3>
                <p className="text-white/70 text-sm mb-3">
                  Esta é uma das partes mais importantes do formulário, por favor, seja o mais específico possível em suas respostas!
                  Caso sua rotina seja EXATAMENTE igual em alguns dias da semana, pode escrever "igual ao dia x". Pode escrever em tópicos, caso fique mais fácil para você.
                </p>
                <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                  <p className="text-white/80 text-sm font-semibold mb-2">Exemplo 👇</p>
                  <ul className="text-white/70 text-xs space-y-1 list-none">
                    <li>✅ 06:00 acordar, refeição 1, ir ao trabalho;</li>
                    <li>✅ 08~12:00 trabalho presencial, não faço mais nenhuma refeição pela manhã;</li>
                    <li>✅ 12:00 almoço no trabalho, levo marmitas de casa;</li>
                    <li>✅ 14:00~16:00 trabalho;</li>
                    <li>✅ 16:00-16:30 intervalo, como no trabalho;</li>
                    <li>✅ 18:00 saio do trabalho;</li>
                    <li>✅ 19:00 chego em casa e faço o pré-treino;</li>
                    <li>✅ 20:00-21:30 jantar;</li>
                    <li>✅ 22:00 pós-treino e lazer;</li>
                    <li>✅ 23:30 dormir.</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Qual é a sua rotina na segunda-feira? Da hora que acorda ao horário que vai dormir, seja detalhista e inclua horários *
                </label>
                <textarea
                  value={formData.rotina_segunda}
                  onChange={(e) => setField("rotina_segunda", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={8}
                  placeholder="Sua resposta"
                />
              </div>
            </div>
          )}

          {/* STEP 14 - Rotina Terça, Quarta e Quinta */}
          {step === 14 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Qual é a sua rotina na terça-feira? Da hora que acorda ao horário que vai dormir, seja detalhista e inclua horários *
                </label>
                <textarea
                  value={formData.rotina_terca}
                  onChange={(e) => setField("rotina_terca", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={6}
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Qual é a sua rotina na quarta-feira? Da hora que acorda ao horário que vai dormir, seja detalhista e inclua horários *
                </label>
                <textarea
                  value={formData.rotina_quarta}
                  onChange={(e) => setField("rotina_quarta", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={6}
                  placeholder="Sua resposta"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 font-semibold uppercase tracking-wide mb-2">
                  Qual é a sua rotina na quinta-feira? Da hora que acorda ao horário que vai dormir, seja detalhista e inclua horários *
                </label>
                <textarea
                  value={formData.rotina_quinta}
                  onChange={(e) => setField("rotina_quinta", e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/20 bg-black/50 text-white placeholder-white/40 focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all duration-200 outline-none hover:border-white/30"
                  rows={6}
                  placeholder="Sua resposta"
                />
              </div>
            </div>
          )}


        </form>

        <div className="flex items-center justify-between mt-6">
          <button
            className="px-6 py-3 rounded-xl backdrop-blur-md bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={step === 1 || isSubmitting}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Voltar
          </button>

          {step < MAX_STEPS ? (
            <button
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep((s) => Math.min(MAX_STEPS, s + 1))}
              disabled={isSubmitting}
            >
              Avançar
            </button>
          ) : (
            <button
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Cadastrar"}
            </button>
          )}
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-red-300 bg-red-600/20 border border-red-600/50 rounded-xl p-4 backdrop-blur-sm">
            {submitError}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 text-sm text-emerald-300 bg-emerald-600/20 border border-emerald-600/50 rounded-xl p-4 backdrop-blur-sm">
            {successMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultoriaCadastro;


