
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/webapp/authentification/AuthContext";
import type { JSX } from "react";

// Webapp pages
import LoginPage from "@/webapp/pages/LoginPage";
import MainPage from "@/webapp/pages/MainPage";
import AdminPanel from "@/webapp/pages/AdminPanel";
import Leaderboard from "@/webapp/pages/Leaderboard";
import ResultsPage from "@/webapp/pages/ResultsPage";
import LiveDataPage from "@/webapp/pages/LiveDataPage";
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

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/app/login" />;
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
          </Route>

          {/* ── Webapp (scoring / admin tool) ── */}
          <Route path="app" element={<WebappLayout />}>
            <Route index element={<MainPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="live-data" element={<LiveDataPage />} />
            <Route path="test" element={<Test />} />
            <Route path="palette" element={<ColorPalette />} />
            {/* Protected */}
            <Route path="admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
            <Route path="news-admin" element={<PrivateRoute><NewsAdminPage /></PrivateRoute>} />
            <Route path="Category/EkoRace" element={<PrivateRoute><EkoRace /></PrivateRoute>} />
            <Route path="Category/MainRace" element={<PrivateRoute><MainRace /></PrivateRoute>} />
            <Route path="Category/ShuttleRun" element={<PrivateRoute><ShuttleRun /></PrivateRoute>} />
            <Route path="Category/SteeringTest" element={<PrivateRoute><SteeringTest /></PrivateRoute>} />
            <Route path="Category/DragRace" element={<PrivateRoute><DragRace /></PrivateRoute>} />
            <Route path="Category/BrakingTest" element={<PrivateRoute><BrakingTest /></PrivateRoute>} />
            <Route path="race-configuration" element={<PrivateRoute><RaceConfiguration /></PrivateRoute>} />
            <Route path="points" element={<PrivateRoute><Points /></PrivateRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
