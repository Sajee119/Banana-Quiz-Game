import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import GamePage from './pages/GamePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AchievementsPage from './pages/AchievementsPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import ScrollActivity from './components/ScrollActivity.jsx';
import { useAuth } from './context/auth-context.js';

export default function App() {
  const { user } = useAuth();
  const reducedMotion = Boolean(user?.preferences?.reducedMotion);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false';
  }, [reducedMotion]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <ScrollActivity />
      <CookieConsent />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/play" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/history/:sessionId" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MotionConfig>
  );
}
