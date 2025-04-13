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
import { AuthPage } from '../features/auth/pages';
import { Dashboard } from '../features/dashboard/pages';
import { ProfilePage } from '../features/profile/pages';
import { SettingsPage } from '../features/settings/pages';
import { DayPage, StepByStepDayPage } from '../features/day/pages';

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
              {/* Auth routes */}
              <Route path={ROUTES.LOGIN} element={<AuthPage />} />
              <Route path={ROUTES.REGISTER} element={<AuthPage />} />
              
              {/* App routes */}
              <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
              <Route path={ROUTES.DAY} element={<DayPage />} />
              <Route path={ROUTES.STEP_BY_STEP_DAY} element={<StepByStepDayPage />} />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              
              {/* Redirect to dashboard */}
              <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </Routes>
          </ProgressProvider>
        </UserProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
