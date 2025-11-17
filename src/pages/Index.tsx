import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import pbLogo from "@/assets/team-pb-20-logo-4.png";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const whatsappNumber = "+5521989319725";
  const whatsappMessage = "Olá! Vim através do site e gostaria de conversar com o Time PB.";
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(whatsappMessage)}`;
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pg7-background">
      {/* Navigation Menu */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex space-x-8 md:space-x-12">
              <button
                onClick={() => navigate("/")}
                className="text-green-400 font-light text-sm md:text-base tracking-wide hover:text-green-300 transition-colors"
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
                className="text-white font-light text-sm md:text-base tracking-wide hover:text-green-400 transition-colors"
              >
                Suporte
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl pg7-content mt-32 md:mt-40">
        <div className="mb-12 md:mb-16 animate-fade-in logo-container-pg4">
          <img 
            src={pbLogo} 
            alt="Team PB 2.0 Logo" 
            className="w-60 h-60 sm:w-80 sm:h-80 object-contain logo-animated"
          />
        </div>
        
        <a 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="animate-fade-in"
        >
          <Button 
            variant="whatsapp" 
            size="lg"
            className="text-base sm:text-lg px-8 py-6 sm:px-12 sm:py-7 rounded-xl font-semibold animate-whatsapp-glow hover:scale-105 transition-transform duration-300"
          >
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            DÚVIDAS CONSULTORIA TEAM PB
          </Button>
        </a>

        {/* Product Grid Section */}
        <div className="mt-16 md:mt-20 w-full px-4 animate-fade-in">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
            {/* Diuriefit Product */}
            <div
              onClick={() => navigate("/diuriefit")}
              className="cursor-pointer group overflow-hidden rounded-lg md:rounded-xl border-2 border-white/10 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 aspect-square w-full"
            >
              <img
                src="/frente-diuriefit.png"
                alt="Diuriefit"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Detoba Product */}
            <div
              onClick={() => navigate("/detoba")}
              className="cursor-pointer group overflow-hidden rounded-lg md:rounded-xl border-2 border-white/10 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 aspect-square w-full"
            >
              <img
                src="/frente-detoba.png"
                alt="Detoba"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Blofa Product */}
            <div
              onClick={() => navigate("/blofa")}
              className="cursor-pointer group overflow-hidden rounded-lg md:rounded-xl border-2 border-white/10 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 aspect-square w-full"
            >
              <img
                src="/frente-blofa2.png"
                alt="Blofa"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 mt-8 text-center text-sm text-muted-foreground">
        <p>Copyright © {new Date().getFullYear()} TEAM PB. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Index;
