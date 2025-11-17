import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/adminseven/AdminLayout";
import Dashboard from "./pages/adminseven/Dashboard";
import UserDetail from "./pages/adminseven/UserDetail";
import ConsultoriaLogin from "./pages/ConsultoriaLogin";
import ConsultoriaCadastro from "./pages/ConsultoriaCadastro";
import UserDashboardLayout from "./pages/dashboard/UserDashboardLayout";
import Home from "./pages/dashboard/Home";
import Historico from "./pages/dashboard/Historico";
import Dieta from "./pages/dashboard/Dieta";
import Treino from "./pages/dashboard/Treino";
import Suporte from "./pages/dashboard/Suporte";
import Diuriefit from "./pages/dashboard/Diuriefit";
import Detoba from "./pages/dashboard/Detoba";
import Blofa from "./pages/dashboard/Blofa";
import Pg2 from "./pages/pg2";
import Pg3 from "./pages/pg3";
import Pg4 from "./pages/pg4";
import Pg5 from "./pages/pg5";
import Pg6 from "./pages/pg6";
import Pg7 from "./pages/pg7";
import Pg8 from "./pages/pg8";
import NotFound from "./pages/NotFound";
import DiuriefitProduct from "./pages/DiuriefitProduct";
import DetobaProduct from "./pages/DetobaProduct";
import BlofaProduct from "./pages/BlofaProduct";
import SuportePublico from "./pages/Suporte";
import SuporteVisitantes from "./pages/adminseven/SuporteVisitantes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/adminseven-login" element={<AdminLogin />} />
          <Route path="/adminseven" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="user/:id" element={<UserDetail />} />
            <Route path="suporte-visitantes" element={<SuporteVisitantes />} />
          </Route>
          <Route path="/dashboard" element={<UserDashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="historico" element={<Historico />} />
            <Route path="dieta" element={<Dieta />} />
            <Route path="treino" element={<Treino />} />
            <Route path="suporte" element={<Suporte />} />
            <Route path="diuriefit" element={<Diuriefit />} />
            <Route path="detoba" element={<Detoba />} />
            <Route path="blofa" element={<Blofa />} />
          </Route>
          <Route path="/consultoria" element={<ConsultoriaLogin />} />
          <Route path="/consultoria-cadastro" element={<ConsultoriaCadastro />} />
          <Route path="/pg2" element={<Pg2 />} />
          <Route path="/pg3" element={<Pg3 />} />
          <Route path="/pg4" element={<Pg4 />} />
          <Route path="/pg5" element={<Pg5 />} />
          <Route path="/pg6" element={<Pg6 />} />
          <Route path="/pg7" element={<Pg7 />} />
          <Route path="/pg8" element={<Pg8 />} />
          <Route path="/diuriefit" element={<DiuriefitProduct />} />
          <Route path="/detoba" element={<DetobaProduct />} />
          <Route path="/blofa" element={<BlofaProduct />} />
          <Route path="/suporte" element={<SuportePublico />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
