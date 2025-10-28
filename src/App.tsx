import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Pg2 from "./pages/pg2";
import Pg3 from "./pages/pg3";
import Pg4 from "./pages/pg4";
import Pg5 from "./pages/pg5";
import Pg6 from "./pages/pg6";
import Pg7 from "./pages/pg7";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pg2" element={<Pg2 />} />
          <Route path="/pg3" element={<Pg3 />} />
          <Route path="/pg4" element={<Pg4 />} />
          <Route path="/pg5" element={<Pg5 />} />
          <Route path="/pg6" element={<Pg6 />} />
          <Route path="/pg7" element={<Pg7 />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
