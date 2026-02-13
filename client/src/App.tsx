import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Leaderboard from "./pages/Leaderboard";
import Quiz from "./pages/Quiz";
import QuizResults from "./pages/QuizResults";
import NotFound from "./pages/NotFound";
import AdminGuard from "./components/admin/AdminGuard";
import Admin from "./pages/admin/Admin";
import AdminQuizzes from "./pages/admin/AdminQuizzes";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminImportQuestions from "./pages/admin/AdminImportQuestions";
import AdminTournaments from "./pages/admin/AdminTournaments";
import TournamentQuiz from "./pages/TournamentQuiz";
import TournamentResults from "./pages/TournamentResults";
import Profile from "./pages/Profile";
import { ErrorBoundary } from "./components/ErrorBoundry";
import GrandTournament from "./pages/GrandTournament";
import KissMarryKill from "./pages/KissMarryKill";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { SpeedInsights } from "@vercel/speed-insights/react"
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner /> 
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/grand-tournament" element={<GrandTournament />} />
              <Route path="/kiss-marry-kill" element={<KissMarryKill />} />
              <Route path="/quiz/:id" element={<Quiz />} />
              <Route path="/quiz/:id/results" element={<QuizResults />} />
              <Route path="/tournament/:id" element={<TournamentQuiz />} />
              <Route path="/tournament/:id/results" element={<TournamentResults />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <Admin />
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/quizzes"
                element={
                  <AdminGuard>
                    <AdminQuizzes />
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/tournaments"
                element={
                  <AdminGuard>
                    <AdminTournaments />
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <AdminGuard>
                    <AdminQuestions />
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/import/questions"
                element={
                  <AdminGuard>
                    <AdminImportQuestions />
                  </AdminGuard>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
      <SpeedInsights />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
