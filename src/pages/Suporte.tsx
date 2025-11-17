import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const Suporte = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    celular: "",
    mensagem: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "mensagem") {
      if (value.length <= 2000) {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setCharCount(value.length);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validações
    if (!formData.nome || !formData.email || !formData.mensagem) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." });
      setLoading(false);
      return;
    }

    if (formData.mensagem.length > 2000) {
      setMessage({ type: "error", text: "A mensagem excede o limite de 2000 caracteres." });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("suporte_visitantes").insert([
        {
          nome: formData.nome,
          email: formData.email,
          celular: formData.celular || null,
          mensagem: formData.mensagem,
          status: "pending",
        },
      ]);

      if (error) {
        throw error;
      }

      setMessage({ type: "success", text: "Mensagem enviada com sucesso! Entraremos em contato em breve." });
      setFormData({ nome: "", email: "", celular: "", mensagem: "" });
      setCharCount(0);
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      setMessage({ type: "error", text: "Erro ao enviar mensagem. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 pg7-background">
      {/* Navigation Menu */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex space-x-8 md:space-x-12">
              <button
                onClick={() => navigate("/")}
                className="text-white font-light text-sm md:text-base tracking-wide hover:text-green-400 transition-colors"
              >
                Início
              </button>
              <button
                onClick={() => navigate("/consultoria")}
                className="text-white font-light text-sm md:text-base tracking-wide hover:text-green-400 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/suporte")}
                className="text-green-400 font-light text-sm md:text-base tracking-wide hover:text-green-300 transition-colors"
              >
                Suporte
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl w-full mt-24 mb-12">
        <div className="backdrop-blur-md bg-white/10 border-2 border-white/20 rounded-2xl p-6 md:p-10 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 text-center">
            Suporte Team PB
          </h1>
          <p className="text-white/70 text-center mb-8">
            Envie sua mensagem e nossa equipe entrará em contato
          </p>

          {message && (
            <div
              className={`p-4 rounded-xl mb-6 ${
                message.type === "success"
                  ? "bg-green-600/20 border border-green-500/50 text-green-300"
                  : "bg-red-600/20 border border-red-500/50 text-red-300"
              }`}
            >
              <p className="font-semibold">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-white font-bold mb-2">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Seu nome completo"
                required
                className="w-full p-3 rounded-xl border-2 border-white/20 bg-black/50 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-white font-bold mb-2">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
                className="w-full p-3 rounded-xl border-2 border-white/20 bg-black/50 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Celular */}
            <div>
              <label className="block text-white font-bold mb-2">Celular (Opcional)</label>
              <input
                type="tel"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="w-full p-3 rounded-xl border-2 border-white/20 bg-black/50 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-white font-bold mb-2">
                Mensagem <span className="text-red-500">*</span>
              </label>
              <textarea
                name="mensagem"
                value={formData.mensagem}
                onChange={handleChange}
                placeholder="Descreva sua dúvida ou problema..."
                required
                rows={6}
                maxLength={2000}
                className="w-full p-3 rounded-xl border-2 border-white/20 bg-black/50 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm resize-none"
              />
              <div className="flex justify-between mt-2">
                <p className="text-xs text-white/50">Máximo 2000 caracteres</p>
                <p className={`text-xs font-bold ${charCount > 1900 ? "text-red-400" : "text-white/70"}`}>
                  {charCount}/2000
                </p>
              </div>
            </div>

            {/* Botão Enviar */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </form>

          {/* Contatos de Suporte */}
          <div className="mt-10 pt-8 border-t border-white/20">
            <h3 className="text-xl font-black text-white mb-4 text-center">
              Ou entre em contato diretamente:
            </h3>
            <div className="space-y-3 text-center">
              <p className="text-white/80">
                <span className="font-bold text-green-400">E-mail Contato:</span>{" "}
                <a href="mailto:contato@teampb.com.br" className="hover:text-green-400 transition-colors">
                  contato@teampb.com.br
                </a>
              </p>
              <p className="text-white/80">
                <span className="font-bold text-green-400">E-mail SAC:</span>{" "}
                <a href="mailto:sac@teampb.com.br" className="hover:text-green-400 transition-colors">
                  sac@teampb.com.br
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full py-4 mt-8 text-center text-sm text-muted-foreground">
        <p>Copyright © {new Date().getFullYear()} TEAM PB. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Suporte;
