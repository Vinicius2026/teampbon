import { useNavigate } from "react-router-dom";

const DetobaProduct = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pg7-background">
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        {/* Banner Image */}
        <div className="flex justify-center mb-8">
          <img
            src="/banner-detoba.png"
            alt="Banner Detoba"
            className="max-w-full h-auto rounded-xl shadow-2xl"
          />
        </div>

        {/* Product Description */}
        <div className="text-center mb-8">
          <p className="text-white/80 text-lg md:text-xl">
            Produtos viriais da nossa vitrine com a seleção de Setembro.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          {/* Back Button - Glass Style */}
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl font-bold text-white backdrop-blur-md bg-white/10 border-2 border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <span>&lt;</span>
            <span>Voltar</span>
          </button>

          {/* Buy Button - Green Style */}
          <button
            className="px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Comprar Produto
          </button>
        </div>
      </div>

      <footer className="w-full py-4 mt-8 text-center text-sm text-muted-foreground">
        <p>Copyright © {new Date().getFullYear()} TEAM PB. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default DetobaProduct;
