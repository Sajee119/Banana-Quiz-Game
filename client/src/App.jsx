import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import GamePage from './pages/GamePage.jsx';
import ModeSelectPage from './pages/ModeSelectPage.jsx';
import GameOverviewPage from './pages/GameOverviewPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AchievementsPage from './pages/AchievementsPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import FaqPage from './pages/FaqPage.jsx';
import HelpCentrePage from './pages/HelpCentrePage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import ScrollActivity from './components/ScrollActivity.jsx';
import { useAuth } from './context/auth-context.js';
import { applyCompactMode, applyTheme } from './lib/theme.js';

export default function App() {
  const { user } = useAuth();
  const reducedMotion = Boolean(user?.preferences?.reducedMotion);
  const theme = user?.preferences?.theme;
  const compactMode = user?.preferences?.compactMode;

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false';
  }, [reducedMotion]);

  useEffect(() => {
    if (!user) return;
    applyTheme(theme || 'light');
  }, [theme, user]);

  useEffect(() => {
    if (!user) return;
    applyCompactMode(Boolean(compactMode));
  }, [compactMode, user]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <ScrollActivity />
      <CookieConsent />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/play" element={<ProtectedRoute><ModeSelectPage /></ProtectedRoute>} />
        <Route path="/play/game" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/game-overview/:gameId" element={<ProtectedRoute><GameOverviewPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/history/:sessionId" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/help" element={<HelpCentrePage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SiteFooter />
    </MotionConfig>
  );
}
