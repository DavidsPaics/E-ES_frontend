
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/webapp/authentification/AuthContext";
import type { JSX } from "react";

// Webapp pages
import AdminPanel from "@/webapp/pages/AdminPanel";
import Leaderboard from "@/webapp/pages/Leaderboard";
import ResultsPage from "@/webapp/pages/ResultsPage";
import LiveDataPage from "@/webapp/pages/LiveDataPage";
import LeaderboardTV from "@/webapp/pages/LeaderboardTV";
import ResultsTV from "@/webapp/pages/ResultsTV";
import LiveDataTV from "@/webapp/pages/LiveDataTV";
import Test from "@/webapp/pages/Test";
import EkoRace from "@/webapp/pages/Categories/EkoRace";
import MainRace from "@/webapp/pages/Categories/MainRace";
import ShuttleRun from "@/webapp/pages/Categories/ShuttleRun";
import SteeringTest from "@/webapp/pages/Categories/SteeringTest";
import DragRace from "@/webapp/pages/Categories/DragRace";
import BrakingTest from "@/webapp/pages/Categories/BrakingTest";
import RaceConfiguration from "@/webapp/pages/RaceConfiguration";
import Points from "@/webapp/pages/Points";
import ColorPalette from "@/webapp/pages/ColorPalette";
import NewsAdminPage from "@/webapp/pages/NewsAdminPage";
import ApplicationReviewPage from "@/webapp/pages/ApplicationReviewPage";
import WebappLayout from "@/webapp/components/WebappLayout.tsx";

// Website pages
import WebsiteLayout from "@/website/components/WebsiteLayout";
import LandingPage from "@/website/pages/LandingPage";
import AboutPage from "@/website/pages/AboutPage";
import NewsPage from "@/website/pages/NewsPage";
import NewsDetailPage from "@/website/pages/NewsDetailPage";
import RulesPage from "@/website/pages/RulesPage";
import EventsPage from "@/website/pages/EventsPage";
import ApplicationPage from "@/website/pages/ApplicationPage";
import TeamPublicPage from "@/website/pages/TeamPublicPage";
import CabinetPage from "@/website/pages/CabinetPage";
import SignInPage from "@/website/pages/SignInPage";
import SignUpPage from "@/website/pages/SignUpPage";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated
    ? children
    : <Navigate to="/signin" state={{ from: location.pathname }} replace />;
}

function RoleRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public Website ── */}
          <Route element={<WebsiteLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="news/:id" element={<NewsDetailPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="apply" element={<ApplicationPage />} />
            <Route path="team/:teamId" element={<TeamPublicPage />} />
            <Route path="signin" element={<SignInPage />} />
            <Route path="signup" element={<SignUpPage />} />
            <Route path="cabinet" element={<PrivateRoute><CabinetPage /></PrivateRoute>} />
          </Route>

          {/* ── Webapp (scoring / admin tool) ── */}
          <Route path="app" element={<WebappLayout />}>
            <Route index element={<Navigate to="leaderboard" replace />} />
            <Route path="login" element={<Navigate to="/signin" />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="live-data" element={<LiveDataPage />} />
            <Route path="test" element={<Test />} />
            <Route path="palette" element={<ColorPalette />} />
            {/* Protected */}
            <Route path="admin" element={<RoleRoute><AdminPanel /></RoleRoute>} />
            <Route path="news-admin" element={<RoleRoute><NewsAdminPage /></RoleRoute>} />
            <Route path="applications-review" element={<RoleRoute><ApplicationReviewPage /></RoleRoute>} />
            <Route path="Category/EkoRace" element={<RoleRoute><EkoRace /></RoleRoute>} />
            <Route path="Category/MainRace" element={<RoleRoute><MainRace /></RoleRoute>} />
            <Route path="Category/ShuttleRun" element={<RoleRoute><ShuttleRun /></RoleRoute>} />
            <Route path="Category/SteeringTest" element={<RoleRoute><SteeringTest /></RoleRoute>} />
            <Route path="Category/DragRace" element={<RoleRoute><DragRace /></RoleRoute>} />
            <Route path="Category/BrakingTest" element={<RoleRoute><BrakingTest /></RoleRoute>} />
            <Route path="race-configuration" element={<RoleRoute><RaceConfiguration /></RoleRoute>} />
            <Route path="points" element={<RoleRoute><Points /></RoleRoute>} />
            {/* TV Display Routes - Admin Only */}
            <Route path="tv/leaderboard" element={<RoleRoute><LeaderboardTV /></RoleRoute>} />
            <Route path="tv/results" element={<RoleRoute><ResultsTV /></RoleRoute>} />
            <Route path="tv/live-data" element={<RoleRoute><LiveDataTV /></RoleRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
