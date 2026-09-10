import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { RouteErrorBoundary } from "@/components/route-error-boundary";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Automation = lazy(() => import("./pages/automation/index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Captures = lazy(() => import("./pages/Captures"));
const Operations = lazy(() => import("./pages/Operations"));
const Accomplishments = lazy(() => import("./pages/Accomplishments"));
const Recordings = lazy(() => import("./pages/Recordings"));
const Workflows = lazy(() => import("./pages/Workflows"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/dual-ai"
                element={<Dashboard initialTab="dual-ai" />}
              />
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
          </Suspense>
        </RouteErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const RouteLoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
    Loading page...
  </div>
);

createRoot(document.getElementById("root")!).render(<App />);
