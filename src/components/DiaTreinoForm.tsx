import { useState, useEffect, useRef } from "react";
import { ExercicioAutocomplete } from "./ExercicioAutocomplete";

interface ExercicioItem {
  exercicio: string;
  serie: string;
}

interface DiaTreinoFormProps {
  dia: string;
  tipo: string;
  onDiaChange: (dia: string) => void;
  onTipoChange: (tipo: string) => void;
  exercicios: ExercicioItem[];
  onExerciciosChange: (exercicios: ExercicioItem[]) => void;
  tiposTreino: string[];
}

export const DiaTreinoForm = ({
  dia,
  tipo,
  onDiaChange,
  onTipoChange,
  exercicios,
  onExerciciosChange,
  tiposTreino,
}: DiaTreinoFormProps) => {
  // Estado local para valores de busca - cada campo é completamente independente
  const [searchValues, setSearchValues] = useState<string[]>(() => {
    // Inicializar com valores dos exercícios existentes se houver, senão vazios
    if (exercicios.length > 0) {
      const padded = [...exercicios];
      while (padded.length < 10) {
        padded.push({ exercicio: "", serie: "" });
      }
      return padded.slice(0, 10).map(e => e.exercicio || "");
    }
    return Array(10).fill("");
  });

  // NÃO usar useEffect para sincronizar - cada campo é independente
  // Os valores de busca só mudam quando o usuário digita/seleciona

  const updateExercicio = (index: number, exercicio: string) => {
    // Garantir que temos pelo menos 10 posições
    const newExercicios = [...exercicios];
    while (newExercicios.length < index + 1) {
      newExercicios.push({ exercicio: "", serie: "" });
    }
    if (!newExercicios[index]) {
      newExercicios[index] = { exercicio: "", serie: "" };
    }
    // Criar novo array para evitar mutação - apenas atualizar o índice específico
    const updatedExercicios = [...newExercicios];
    updatedExercicios[index] = { ...updatedExercicios[index], exercicio };
    
    // Atualizar apenas o valor de busca do índice específico ANTES de chamar onExerciciosChange
    setSearchValues((prev) => {
      const newValues = [...prev];
      while (newValues.length < index + 1) {
        newValues.push("");
      }
      newValues[index] = exercicio;
      return newValues;
    });
    
    // Atualizar os exercícios - isso não deve afetar outros campos
    onExerciciosChange(updatedExercicios);
  };

  const updateSerie = (index: number, serie: string) => {
    // Garantir que temos pelo menos 10 posições
    const newExercicios = [...exercicios];
    while (newExercicios.length < index + 1) {
      newExercicios.push({ exercicio: "", serie: "" });
    }
    if (!newExercicios[index]) {
      newExercicios[index] = { exercicio: "", serie: "" };
    }
    // Criar novo array para evitar mutação
    const updatedExercicios = [...newExercicios];
    updatedExercicios[index] = { ...updatedExercicios[index], serie };
    
    onExerciciosChange(updatedExercicios);
  };

  const removeExercicio = (index: number) => {
    const newExercicios = [...exercicios];
    newExercicios[index] = { exercicio: "", serie: "" };
    const newSearchValues = [...searchValues];
    newSearchValues[index] = "";
    onExerciciosChange(newExercicios);
    setSearchValues(newSearchValues);
  };

  // Garantir que sempre temos 10 posições
  const exerciciosPadded = [...exercicios];
  while (exerciciosPadded.length < 10) {
    exerciciosPadded.push({ exercicio: "", serie: "" });
  }
  const searchValuesPadded = [...searchValues];
  while (searchValuesPadded.length < 10) {
    searchValuesPadded.push("");
  }

  return (
    <div className="border-t border-white/10 pt-4 mt-4">
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          value={dia}
          onChange={(e) => onDiaChange(e.target.value)}
          className="flex-1 p-2 rounded-lg border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all text-sm"
          placeholder="Dia da semana"
        />
        <select
          value={tipo}
          onChange={(e) => onTipoChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-white/20 bg-black text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all text-sm"
        >
          {tiposTreino.map((tipoOption) => (
            <option key={tipoOption} value={tipoOption}>
              {tipoOption}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, index) => {
          const exercicio = exerciciosPadded[index] || { exercicio: "", serie: "" };
          const temConteudo = exercicio.exercicio.trim() !== "" || exercicio.serie.trim() !== "";

          return (
            <div
              key={index}
              className={`flex gap-2 items-start p-2 rounded-lg border ${
                temConteudo
                  ? "border-red-500/50 bg-red-900/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex-1 min-w-0">
                <ExercicioAutocomplete
                  value={searchValuesPadded[index] || ""}
                  onChange={(value) => {
                    // Atualizar apenas o campo específico, sem afetar os outros
                    setSearchValues((prev) => {
                      const newValues = [...prev];
                      while (newValues.length < index + 1) {
                        newValues.push("");
                      }
                      newValues[index] = value;
                      return newValues;
                    });
                  }}
                  onSelect={(exercicioNome) => {
                    // Atualizar apenas o exercício do índice específico
                    // O updateExercicio já atualiza o searchValues internamente
                    updateExercicio(index, exercicioNome);
                  }}
                  placeholder={`Exercício ${index + 1}...`}
                  className="text-xs"
                />
              </div>
              
              {exercicio.exercicio && (
                <>
                  <div className="flex items-center text-white/50 text-xs px-2">
                    /
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={exercicio.serie}
                      onChange={(e) => updateSerie(index, e.target.value)}
                      placeholder="Série (ex: AQ + RC1 + RC2 + 2 ST)"
                      className="w-full p-2 rounded-lg border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercicio(index)}
                    className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-600/20 transition-colors"
                    title="Remover exercício"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

