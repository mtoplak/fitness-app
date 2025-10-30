import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardRouter from "./pages/DashboardRouter";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import AuthTest from "./pages/AuthTest";
import SiteLayout from "./layouts/SiteLayout";
import RegisterTrainer from "./pages/RegisterTrainer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <SiteLayout>
                  <Index />
                </SiteLayout>
              }
            />
            <Route
              path="/login"
              element={
                <SiteLayout>
                  <Login />
                </SiteLayout>
              }
            />
            <Route
              path="/register"
              element={
                <SiteLayout>
                  <Register />
                </SiteLayout>
              }
            />
            <Route
              path="/register-trainer"
              element={
                <SiteLayout>
                  <RegisterTrainer />
                </SiteLayout>
              }
            />
            <Route
              path="/auth-test"
              element={
                <SiteLayout>
                  <AuthTest />
                </SiteLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <SiteLayout>
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                </SiteLayout>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route
              path="*"
              element={
                <SiteLayout>
                  <NotFound />
                </SiteLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
