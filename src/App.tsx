import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import AppHome from "./pages/AppHome";
import Community from "./pages/Community";
import LoansWorkspace from "./pages/LoansWorkspace";
import MembersWorkspace from "./pages/MembersWorkspace";
import SettingsWorkspace from "./pages/SettingsWorkspace";
import Welcome from "./pages/Welcome";
import GroupDetail from "./pages/GroupDetail";
import CreateGroup from "./pages/CreateGroup";
import JoinGroup from "./pages/JoinGroup";
import Contributions from "./pages/Contributions";
import Investments from "./pages/Investments";
import Transactions from "./pages/Transactions";
import Expenses from "./pages/Expenses";
import Chat from "./pages/Chat";
import MyCards from "./pages/MyCards";

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
        path="/welcome/create"
        element={
          <ProtectedRoute>
            <WelcomeRoute>
              <CreateGroup />
            </WelcomeRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/welcome/join"
        element={
          <ProtectedRoute>
            <WelcomeRoute>
              <JoinGroup />
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
        path="/app/community"
        element={
          <ProtectedRoute>
            <AppRoute>
              <Community />
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
        path="/app/create-group"
        element={
          <ProtectedRoute>
            <AppRoute>
              <CreateGroup />
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
        path="/app/members"
        element={
          <ProtectedRoute>
            <AppRoute>
              <MembersWorkspace />
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
      <Route
        path="/app/contributions"
        element={
          <ProtectedRoute>
            <AppRoute>
              <Contributions />
            </AppRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/invest"
        element={
          <ProtectedRoute>
            <AppRoute>
              <Investments />
            </AppRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/transactions"
        element={
          <ProtectedRoute>
            <AppRoute>
              <Transactions />
            </AppRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/expenses"
        element={
          <ProtectedRoute>
            <AppRoute>
              <Expenses />
            </AppRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/chat"
        element={
          <ProtectedRoute>
            <AppRoute>
              <Chat />
            </AppRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/cards"
        element={
          <ProtectedRoute>
            <AppRoute>
              <MyCards />
            </AppRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
