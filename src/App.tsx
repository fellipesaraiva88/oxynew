import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PawLoader } from "@/components/PawLoader";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { TourProvider } from "@/components/tour/TourProvider";
import { SystemTour } from "@/components/tour/SystemTour";
import { TopBar } from "@/components/TopBar";
import { CursorPet } from "@/components/CursorPet";
import { ThemeProvider } from "next-themes";
import { OnboardingGuard } from "@/components/OnboardingGuard";

// Lazy load pages for better code-splitting
const Index = lazy(() => import("./pages/Index"));
const Conversas = lazy(() => import("./pages/Conversas"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Pacientes = lazy(() => import("./pages/Pacientes"));
const PacientesKanban = lazy(() => import("./pages/PacientesKanban"));
const Vendas = lazy(() => import("./pages/Vendas"));
const IA = lazy(() => import("./pages/IA"));
const AIOnboarding = lazy(() => import("./pages/AIOnboarding"));
const Ajustes = lazy(() => import("./pages/Ajustes"));
const WhatsAppSetup = lazy(() => import("./pages/WhatsAppSetup"));
const AuroraMeetPage = lazy(() => import("./pages/AuroraMeetPage"));
const TrainingPlans = lazy(() => import("./pages/TrainingPlans"));
const DaycareStays = lazy(() => import("./pages/DaycareStays"));
const BipePanel = lazy(() => import("./pages/BipePanel"));
const OnboardingWizard = lazy(() => import("./pages/Onboarding/OnboardingWizard").then(module => ({ default: module.OnboardingWizard })));
const OnboardingV2 = lazy(() => import("./pages/OnboardingV2/OnboardingV2"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Impersonate = lazy(() => import("./pages/Impersonate"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin Panel
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const LoginAdmin = lazy(() => import("./pages/admin/LoginAdmin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ClientsAdmin = lazy(() => import("./pages/admin/ClientsAdmin"));
const Monitoring = lazy(() => import("./pages/admin/Monitoring"));
const Logs = lazy(() => import("./pages/admin/Logs"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const TokenUsage = lazy(() => import("./pages/admin/TokenUsage"));
const Settings = lazy(() => import("./pages/admin/Settings"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <TourProvider>
          <Toaster />
          <Sonner />
          <SystemTour />
          <BrowserRouter>
          <Suspense fallback={<PawLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/impersonate" element={<Impersonate />} />

            {/* Onboarding V2 - Protected but outside OnboardingGuard */}
            <Route
              path="/onboarding-v2"
              element={
                <ProtectedRoute>
                  <OnboardingV2 />
                </ProtectedRoute>
              }
            />

            {/* Admin Panel Routes (separate auth) */}
            <Route path="/admin/login" element={<LoginAdmin />} />
            <Route
              path="/admin/*"
              element={
                <AdminLayout />
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<ClientsAdmin />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="logs" element={<Logs />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="token-usage" element={<TokenUsage />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <SidebarProvider>
                      <div className="min-h-screen flex w-full">
                        <AppSidebar />
                        <main className="flex-1 overflow-x-hidden">
                          <ImpersonationBanner />
                          <TopBar />
                          <CursorPet />
                          <Suspense fallback={<PawLoader />}>
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/conversas" element={<Conversas />} />
                              <Route path="/agenda" element={<Agenda />} />
                              <Route path="/clientes" element={<PacientesKanban />} />
                              <Route path="/clientes-old" element={<Pacientes />} />
                              <Route path="/vendas" element={<Vendas />} />
                              <Route path="/ia" element={<IA />} />
                              <Route path="/ia/onboarding" element={<AIOnboarding />} />
                              <Route path="/ajustes" element={<Ajustes />} />
                              <Route path="/whatsapp" element={<WhatsAppSetup />} />
                              <Route path="/oxy_assistant/meet" element={<AuroraMeetPage />} />
                              <Route path="/training-plans" element={<TrainingPlans />} />
                              <Route path="/daycare" element={<DaycareStays />} />
                              <Route path="/bipe" element={<BipePanel />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </main>
                      </div>
                    </SidebarProvider>
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
        </TourProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
