import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// BrowserRouter 대신 HashRouter를 가져옵니다.
import { HashRouter, Routes, Route } from "react-router-dom"; 
import Index from "./pages/Index";
import JobDetail from "./pages/JobDetail";
import Trends from "./pages/Trends";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* HashRouter는 basename 설정이 필요 없으며 GitHub Pages에서 가장 안전합니다. */}
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;