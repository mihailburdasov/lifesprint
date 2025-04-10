import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import ScrollToTop from './components/common/ScrollToTop';
import Dashboard from './pages/Dashboard';
import DayPage from './pages/DayPage';
import StepByStepDayPage from './pages/StepByStepDayPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import SettingsPage from './pages/SettingsPage';
import MigrationPage from './pages/MigrationPage';
import { supabase } from './utils/supabaseClient';

// Улучшенный компонент для защиты маршрутов
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Используем хук для получения данных о пользователе
  const { isAuthenticated, isLoading } = useUser();
  
  // Если идет загрузка, показываем индикатор загрузки
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Загрузка...</div>;
  }
  
  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <ProgressProvider>
          <Router>
            <ScrollToTop />
            <div className="app-container min-h-screen">
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/migration" element={<MigrationPage />} />
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/day/:dayId" 
                  element={
                    <ProtectedRoute>
                      <DayPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/day/:dayId/step/:stepId" 
                  element={
                    <ProtectedRoute>
                      <StepByStepDayPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
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
                <Route path="*" element={<div className="p-4">404 - Not Found</div>} />
              </Routes>
            </div>
          </Router>
        </ProgressProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
