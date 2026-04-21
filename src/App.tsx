import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import AppHome from "./pages/AppHome";
import ChamasWorkspace from "./pages/ChamasWorkspace";
import LoansWorkspace from "./pages/LoansWorkspace";
import SettingsWorkspace from "./pages/SettingsWorkspace";
import Welcome from "./pages/Welcome";
import GroupDetail from "./pages/GroupDetail";
import MyActivity from "./pages/MyActivity";
import ContributionsWorkspace from "./pages/ContributionsWorkspace";
import ExpensesWorkspace from "./pages/ExpensesWorkspace";
import ChatWorkspace from "./pages/ChatWorkspace";
import ReportsWorkspace from "./pages/ReportsWorkspace";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f9ff]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-3xl gradient-accent flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-xl">K</span>
        </div>
        <p className="text-slate-500 text-sm">Loading your workspace...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoute({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

function WelcomeRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomeRoute>
                <Welcome />
              </WelcomeRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Navigate to="/app/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/dashboard"
          element={
            <ProtectedRoute>
              <AppRoute>
                <AppHome />
              </AppRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/chamas"
          element={
            <ProtectedRoute>
              <AppRoute>
                <ChamasWorkspace />
              </AppRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/groups/:id"
          element={
            <ProtectedRoute>
              <AppRoute>
                <GroupDetail />
              </AppRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/loans"
          element={
            <ProtectedRoute>
              <AppRoute>
                <LoansWorkspace />
              </AppRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/contributions"
          element={
            <ProtectedRoute>
              <AppRoute>
                <ContributionsWorkspace />
              </AppRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/expenses"
          element={
            <ProtectedRoute>
              <AppRoute>
                <ExpensesWorkspace />
              </AppRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/chat"
          element={
            <ProtectedRoute>
              <AppRoute>
                <ChatWorkspace />
              </AppRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/reports"
          element={
            <ProtectedRoute>
              <AppRoute>
                <ReportsWorkspace />
              </AppRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/activity"
          element={
            <ProtectedRoute>
              <AppRoute>
                <MyActivity />
              </AppRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/settings"
          element={
            <ProtectedRoute>
              <AppRoute>
                <SettingsWorkspace />
              </AppRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
