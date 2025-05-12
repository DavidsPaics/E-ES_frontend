
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/authentification/AuthContext";
import LoginPage from "@/pages/LoginPage";
import MainPage from "@/pages/MainPage";
import AdminPanel from "@/pages/AdminPanel";
import Leaderboard from "@/pages/Leaderboard";
import RaceConfigPage from "@/pages/RaceConfigPage";
import type { JSX } from "react";
import ResultsPage from "@/pages/ResultsPage";
import LiveDataPage from "@/pages/LiveDataPage";
import WSTestPage from "@/pages/Test";
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} /> {/* <-- now public */}
          <Route path="/race-config" element={<RaceConfigPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/live-data" element={<LiveDataPage />} />
          <Route path="/test" element={<WSTestPage />} />
          {/* Protected pages */}
          <Route path="/admin" element={
            <PrivateRoute><AdminPanel /></PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
