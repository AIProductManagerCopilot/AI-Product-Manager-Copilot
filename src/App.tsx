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
import { FeatureRequestsPage } from './pages/FeatureRequests';
import { PrioritizationPage } from './pages/Prioritization';
import { PRDGeneratorPage } from './pages/PRDGenerator';
import { RoadmapPage } from './pages/Roadmap';
import { AskCopilotPage } from './pages/AskCopilot';
import { FeedbackIngestionPage } from './pages/FeedbackIngestion';
import { ProductAnalyticsPage } from './pages/ProductAnalytics';
import { ThemeExtractionPage } from './pages/ThemeExtraction';
import { SettingsPage } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
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
                path="/feedback-ingestion"
                element={
                  <ProtectedRoute>
                    <FeedbackIngestionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/product-analytics"
                element={
                  <ProtectedRoute>
                    <ProductAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/theme-extraction"
                element={
                  <ProtectedRoute>
                    <ThemeExtractionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feature-requests"
                element={
                  <ProtectedRoute>
                    <FeatureRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prioritization"
                element={
                  <ProtectedRoute>
                    <PrioritizationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prd-generator"
                element={
                  <ProtectedRoute>
                    <PRDGeneratorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roadmap"
                element={
                  <ProtectedRoute>
                    <RoadmapPage />
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
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ThemeWrapper>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
