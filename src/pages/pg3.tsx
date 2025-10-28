import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import pbLogo from "@/assets/team-pb-20-logo-2.png";

const Pg3 = () => {
  const whatsappNumber = "+5521999999999";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`;
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <main className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl">
        <div className="mb-12 animate-fade-in">
          <img 
            src={pbLogo} 
            alt="Team PB 2.0 Logo" 
            className="w-60 h-60 sm:w-80 sm:h-80 object-contain"
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
            CONVERSE COM O TIME PB
          </Button>
        </a>
      </main>

      <footer className="w-full py-4 mt-8 text-center text-sm text-muted-foreground">
        <p>Copyright © {new Date().getFullYear()} TEAM PB. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Pg3;

