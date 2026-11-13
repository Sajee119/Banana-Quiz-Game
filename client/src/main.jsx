import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { initAudio } from './audio/audioEngine.js';
import {
  applyCompactMode,
  applyTheme,
  readStoredCompactMode,
  readStoredTheme,
} from './lib/theme.js';
import './index.css';

applyTheme(readStoredTheme(), { persist: false });
applyCompactMode(readStoredCompactMode(), { persist: false });
initAudio();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);