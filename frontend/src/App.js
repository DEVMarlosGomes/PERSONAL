import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PersonalDashboard from "./pages/PersonalDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentsPage from "./pages/StudentsPage";
import WorkoutsPage from "./pages/WorkoutsPage";
import ProgressPage from "./pages/ProgressPage";
import NotificationsPage from "./pages/NotificationsPage";
import ChatPage from "./pages/ChatPage";
import GamificationPage from "./pages/GamificationPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import ExerciseLibraryPage from "./pages/ExerciseLibraryPage";
import FinancialPage from "./pages/FinancialPage";
import RoutinesPage from "./pages/RoutinesPage";
import CheckinsPage from "./pages/CheckinsPage";
import EvolutionPhotosPage from "./pages/EvolutionPhotosPage";
import StudentFinancialPage from "./pages/StudentFinancialPage";
import PeriodizationPage from "./pages/PeriodizationPage";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "personal" ? "/dashboard" : "/treino"} replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === "personal" ? "/dashboard" : "/treino"} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Personal Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["personal"]}>
          <PersonalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/alunos" element={
        <ProtectedRoute allowedRoles={["personal"]}>
          <StudentsPage />
        </ProtectedRoute>
      } />
      <Route path="/treinos" element={
        <ProtectedRoute allowedRoles={["personal"]}>
          <WorkoutsPage />
        </ProtectedRoute>
      } />
      <Route path="/evolucao" element={
        <ProtectedRoute allowedRoles={["personal"]}>
          <ProgressPage />
        </ProtectedRoute>
      } />
      <Route path="/avaliacoes" element={
        <ProtectedRoute allowedRoles={["personal"]}>
          <AssessmentsPage />
        </ProtectedRoute>
      } />
      <Route path="/biblioteca" element={
        <ProtectedRoute allowedRoles={["personal"]}>
          <ExerciseLibraryPage />
        </ProtectedRoute>
      } />
      <Route path="/financeiro" element={
        <ProtectedRoute allowedRoles={["personal"]}>
          <FinancialPage />
        </ProtectedRoute>
      } />
      <Route path="/rotinas" element={
        <ProtectedRoute allowedRoles={["personal"]}>
          <RoutinesPage />
        </ProtectedRoute>
      } />
      <Route path="/frequencia" element={
        <ProtectedRoute>
          <CheckinsPage />
        </ProtectedRoute>
      } />
      <Route path="/fotos-evolucao" element={
        <ProtectedRoute>
          <EvolutionPhotosPage />
        </ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/treino" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/meu-progresso" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <ProgressPage />
        </ProtectedRoute>
      } />
      <Route path="/minhas-avaliacoes" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <AssessmentsPage />
        </ProtectedRoute>
      } />
      <Route path="/meu-financeiro" element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentFinancialPage />
        </ProtectedRoute>
      } />
      <Route path="/periodizacao" element={
        <ProtectedRoute>
          <PeriodizationPage />
        </ProtectedRoute>
      } />

      {/* Shared Routes */}
      <Route path="/notificacoes" element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      } />
      <Route path="/conquistas" element={
        <ProtectedRoute>
          <GamificationPage />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
