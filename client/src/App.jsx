import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import LoginPage from './pages/LoginPage.jsx';
import { useAuth } from './context/auth-context.js';

export default function App() {
  const { user } = useAuth();
  const reducedMotion = Boolean(user?.preferences?.reducedMotion);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false';
  }, [reducedMotion]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MotionConfig>
  );
}
