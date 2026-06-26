import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import Teams from './pages/Teams';
import TeamProfile from './pages/TeamProfile';
import Training from './pages/Training';
import Matches from './pages/Matches';
import MatchReport from './pages/MatchReport';
import Calendar from './pages/Calendar';
import Scouting from './pages/Scouting';
import ParentPortal from './pages/ParentPortal';
import Announcements from './pages/Announcements';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Seasons from './pages/Seasons';
import SeasonDetail from './pages/SeasonDetail';
import FormationAnalysis from './pages/FormationAnalysis';
import PlayerComparison from './pages/PlayerComparison';
import AIInsights from './pages/AIInsights';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
          <Route path="/players/:id" element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/teams/:id" element={<ProtectedRoute><TeamProfile /></ProtectedRoute>} />
          <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/matches/:id" element={<ProtectedRoute><MatchReport /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/scouting" element={<ProtectedRoute><Scouting /></ProtectedRoute>} />
          <Route path="/parent-portal" element={<ProtectedRoute><ParentPortal /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/seasons" element={<ProtectedRoute><Seasons /></ProtectedRoute>} />
          <Route path="/seasons/:id" element={<ProtectedRoute><SeasonDetail /></ProtectedRoute>} />
          <Route path="/formations" element={<ProtectedRoute><FormationAnalysis /></ProtectedRoute>} />
          <Route path="/compare-players" element={<ProtectedRoute><PlayerComparison /></ProtectedRoute>} />
          <Route path="/ai-insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
