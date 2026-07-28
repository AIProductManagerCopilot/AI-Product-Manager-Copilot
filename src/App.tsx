import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeWrapper } from './components/ThemeWrapper';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth pages
import { WelcomePage } from './pages/Welcome';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
import { VerifyEmailPage } from './pages/VerifyEmail';

// App pages
import { DashboardPage } from './pages/Dashboard';
import { WorkspaceDetailPage } from './pages/Workspace';
<<<<<<< HEAD
=======
import { AskCopilotPage } from './pages/AskCopilot';

import { SidebarProvider } from './context/SidebarContext';
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
<<<<<<< HEAD
        <Router>
          <ThemeWrapper>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspace/:workspaceId"
                element={
                  <ProtectedRoute>
                    <WorkspaceDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ThemeWrapper>
        </Router>
=======
        <SidebarProvider>
          <Router>
            <ThemeWrapper>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<WelcomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspaces"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspace/:workspaceId"
                  element={
                    <ProtectedRoute>
                      <WorkspaceDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ask-copilot"
                  element={
                    <ProtectedRoute>
                      <AskCopilotPage />
                    </ProtectedRoute>
                  }
                />
                {[
                  '/feedback-ingestion',
                  '/product-analytics',
                  '/theme-extraction',
                  '/feature-requests',
                  '/prioritization',
                  '/prd-generator',
                  '/roadmap',
                  '/settings',
                ].map((path) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                ))}

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ThemeWrapper>
          </Router>
        </SidebarProvider>
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
