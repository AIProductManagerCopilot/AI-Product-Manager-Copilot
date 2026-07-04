import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeWrapper } from './components/ThemeWrapper';
import { WelcomePage } from './pages/Welcome';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
import { VerifyEmailPage } from './pages/VerifyEmail';
import { DashboardMockPage } from './pages/DashboardMock';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <ThemeWrapper>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/dashboard" element={<DashboardMockPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeWrapper>
      </Router>
    </AuthProvider>
  );
};

export default App;
