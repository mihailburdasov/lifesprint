/**
 * Main App component
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import shared
import { ROUTES, THEMES } from '../shared/constants';
import { initializeTheme } from '../shared/styles';

// Import core
import { useLocalStorage } from '../core/hooks';
import { ScrollToTop } from '../core/components';

// Import pages from features
import { AuthPage, UpdatePasswordPage, EmailConfirmationPage } from '../features/auth/pages';
import { Dashboard } from '../features/dashboard/pages';
import { ProfilePage } from '../features/profile/pages';
import { SettingsPage } from '../features/settings/pages';
import { DayPage, StepByStepDayPage } from '../features/day/pages';

// Import components
import { ProtectedRoute } from '../features/auth/components';

// Import contexts
import { UserProvider } from '../context/UserContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ProgressProvider } from '../features/day/context';

/**
 * App component
 */
const App: React.FC = () => {
  // Get theme from local storage
  const [theme] = useLocalStorage<string>('theme', THEMES.LIGHT);
  
  // Initialize theme
  useEffect(() => {
    initializeTheme(theme);
  }, [theme]);
  
  return (
    <Router>
      <ScrollToTop />
      <ThemeProvider>
        <UserProvider>
          <ProgressProvider>
            <Routes>
              {/* Auth routes - accessible to everyone */}
              <Route path={ROUTES.LOGIN} element={<AuthPage />} />
              <Route path={ROUTES.REGISTER} element={<AuthPage />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<AuthPage />} />
              <Route path={ROUTES.UPDATE_PASSWORD} element={<UpdatePasswordPage />} />
              <Route path={ROUTES.EMAIL_CONFIRMATION} element={<EmailConfirmationPage />} />
              
              {/* Protected app routes - only accessible when authenticated */}
              <Route 
                path={ROUTES.DASHBOARD} 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={ROUTES.DAY} 
                element={
                  <ProtectedRoute>
                    <DayPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={ROUTES.STEP_BY_STEP_DAY} 
                element={
                  <ProtectedRoute>
                    <StepByStepDayPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={ROUTES.PROFILE} 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={ROUTES.SETTINGS} 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect to dashboard - also protected */}
              <Route 
                path={ROUTES.HOME} 
                element={
                  <ProtectedRoute>
                    <Navigate to={ROUTES.DASHBOARD} replace />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback route - also protected */}
              <Route 
                path="*" 
                element={
                  <ProtectedRoute>
                    <Navigate to={ROUTES.DASHBOARD} replace />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </ProgressProvider>
        </UserProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
