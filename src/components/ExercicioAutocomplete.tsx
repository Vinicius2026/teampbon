import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Exercicio {
  id: string;
  nome: string;
}

interface ExercicioAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (exercicio: string) => void;
  placeholder?: string;
  className?: string;
}

export const ExercicioAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Digite o nome do exercício...",
  className = "",
}: ExercicioAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Exercicio[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchExercicios = async () => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("buscar_exercicios", {
          query: value.trim(),
        });

        if (error) {
          console.error("Erro ao buscar exercícios:", error);
          setSuggestions([]);
        } else {
          setSuggestions(data || []);
          setShowSuggestions(data && data.length > 0);
        }
      } catch (err) {
        console.error("Erro:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchExercicios, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleSelect = (exercicio: Exercicio) => {
    onSelect(exercicio.nome);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className="w-full p-2 rounded-lg border border-white/20 bg-black text-white placeholder:text-white/40 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all text-sm"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-black border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {loading && (
            <div className="p-2 text-center text-white/50 text-xs">
              Buscando...
            </div>
          )}
          {suggestions.map((exercicio) => (
            <button
              key={exercicio.id}
              type="button"
              onClick={() => handleSelect(exercicio)}
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-red-600/20 transition-colors border-b border-white/5 last:border-b-0"
            >
              {exercicio.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

