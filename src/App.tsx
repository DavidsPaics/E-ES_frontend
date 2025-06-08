
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/authentification/AuthContext";
import LoginPage from "@/pages/LoginPage";
import MainPage from "@/pages/MainPage";
import AdminPanel from "@/pages/AdminPanel";
import Leaderboard from "@/pages/Leaderboard";
import type { JSX } from "react";
import ResultsPage from "@/pages/ResultsPage";
import LiveDataPage from "@/pages/LiveDataPage";
import WSTestPage from "@/pages/Test";
import EkoRace from "@/pages/Categories/EkoRace";
import MainRace from "@/pages/Categories/MainRace";
import ShuttleRun from "@/pages/Categories/ShuttleRun";
import SteeringTest from "@/pages/Categories/SteeringTest";
import DragRace from "@/pages/Categories/DragRace";
import BrakingTest from "@/pages/Categories/BrakingTest";
import RaceConfiguration from "@/pages/RaceConfiguration";
import Points from "@/pages/Points";

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
          
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/live-data" element={<LiveDataPage />} />
          <Route path="/test" element={<WSTestPage />} />
          {/* Protected pages */}
          <Route path="/admin" element={
            <PrivateRoute><AdminPanel /></PrivateRoute> } />
          <Route path ="/Category/EkoRace" element={
            <PrivateRoute><EkoRace /></PrivateRoute>} />
          <Route path ="/Category/MainRace" element={
            <PrivateRoute><MainRace /></PrivateRoute>} />
          <Route path ="/Category/ShuttleRun" element={
            <PrivateRoute><ShuttleRun /></PrivateRoute>} />
          <Route path ="/Category/SteeringTest" element={
            <PrivateRoute><SteeringTest /></PrivateRoute>} />
          <Route path ="/Category/DragRace" element={
            <PrivateRoute><DragRace /></PrivateRoute>} />
          <Route path ="/Category/BrakingTest" element={
            <PrivateRoute><BrakingTest /></PrivateRoute>} />
          <Route path="/race-configuration" element={
            <PrivateRoute><RaceConfiguration /></PrivateRoute>} />
          <Route path="/points" element={
            <PrivateRoute><Points /></PrivateRoute>} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
