import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import ScrollToTop from './components/common/ScrollToTop';
import InstallPWA from './components/common/InstallPWA';
import OfflineIndicator from './components/common/OfflineIndicator';
import SkipLink from './components/common/SkipLink';
import { AppErrorBoundary } from './components/common/ErrorBoundary';
import { logService } from './utils/logService';
import { supabase } from './utils/supabaseClient';

// Ленивая загрузка компонентов страниц
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DayPage = lazy(() => import('./pages/DayPage'));
const StepByStepDayPage = lazy(() => import('./pages/StepByStepDayPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MigrationPage = lazy(() => import('./pages/MigrationPage'));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const PasswordResetConfirmPage = lazy(() => import('./pages/PasswordResetConfirmPage'));

// Компонент загрузки для Suspense
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-pulse text-primary text-xl">Загрузка...</div>
  </div>
);

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
  // Логируем запуск приложения
  logService.info('Приложение запущено', { version: '1.0.2' });
  
  return (
    <ThemeProvider>
      <UserProvider>
        <ProgressProvider>
          <AppErrorBoundary>
            <Router>
              <SkipLink />
              <ScrollToTop />
              <div className="app-container min-h-screen">
                <main id="main-content">
              <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 space-y-2">
                <InstallPWA />
                <OfflineIndicator />
              </div>
              <Routes>
                <Route path="/auth" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AuthPage />
                  </Suspense>
                } />
                <Route path="/onboarding" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <OnboardingPage />
                  </Suspense>
                } />
                <Route path="/migration" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <MigrationPage />
                  </Suspense>
                } />
                <Route path="/verify-email" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmailVerificationPage />
                  </Suspense>
                } />
                <Route path="/reset-password" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <PasswordResetPage />
                  </Suspense>
                } />
                <Route path="/reset-password-confirm" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <PasswordResetConfirmPage />
                  </Suspense>
                } />
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <Dashboard />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/day/:dayId" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <DayPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/day/:dayId/step/:stepId" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <StepByStepDayPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <ProfilePage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <SettingsPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<div className="p-4">404 - Not Found</div>} />
              </Routes>
                </main>
              </div>
            </Router>
          </AppErrorBoundary>
        </ProgressProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
