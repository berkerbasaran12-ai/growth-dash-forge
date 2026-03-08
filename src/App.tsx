import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientDetail from "./pages/ClientDetail";
import KnowledgeBase from "./pages/KnowledgeBase";
import AdminClients from "./pages/AdminClients";
import AdminKnowledge from "./pages/AdminKnowledge";
import SettingsPage from "./pages/SettingsPage";
import Integrations from "./pages/Integrations";
import AcceptInvite from "./pages/AcceptInvite";
import ResetPassword from "./pages/ResetPassword";
import ActivityLogs from "./pages/ActivityLogs";
import Goals from "./pages/Goals";
import Finance from "./pages/Finance";
import Analytics from "./pages/Analytics";
import ReportBuilder from "./pages/ReportBuilder";
import MyReports from "./pages/MyReports";
import KnowledgeCategoryDetail from "./pages/KnowledgeCategoryDetail";
import OnboardingTemplates from "./pages/OnboardingTemplates";
import ClientOnboarding from "./pages/ClientOnboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/invite" element={<AcceptInvite />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
              <Route path="/knowledge-base/:categoryId" element={<ProtectedRoute><KnowledgeCategoryDetail /></ProtectedRoute>} />
              <Route path="/admin/clients" element={<ProtectedRoute adminOnly><AdminClients /></ProtectedRoute>} />
              <Route path="/admin/clients/:userId" element={<ProtectedRoute adminOnly><ClientDetail /></ProtectedRoute>} />
              <Route path="/admin/knowledge" element={<ProtectedRoute adminOnly><AdminKnowledge /></ProtectedRoute>} />
              <Route path="/admin/activity" element={<ProtectedRoute adminOnly><ActivityLogs /></ProtectedRoute>} />
              <Route path="/admin/onboarding-templates" element={<ProtectedRoute adminOnly><OnboardingTemplates /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><ClientOnboarding /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
              <Route path="/reports/new" element={<ProtectedRoute><ReportBuilder /></ProtectedRoute>} />
              <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
