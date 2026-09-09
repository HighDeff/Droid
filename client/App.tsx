import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Automation from "./pages/automation/index";
import { AIChat } from "@/components/ai-chat";
import NotFound from "./pages/NotFound";
import Workspace from "./pages/Workspace";
import Captures from "./pages/Captures";
import Operations from "./pages/Operations";
import Accomplishments from "./pages/Accomplishments";
import Recordings from "./pages/Recordings";
import Workflows from "./pages/Workflows";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dual-ai" element={<Dashboard initialTab="dual-ai" />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/captures" element={<Captures />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/accomplishments" element={<Accomplishments />} />
          <Route path="/recordings" element={<Recordings />} />
          <Route path="/workflows" element={<Workflows />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
