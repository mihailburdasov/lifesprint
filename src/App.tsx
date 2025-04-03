import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import ScrollToTop from './components/common/ScrollToTop';
import Dashboard from './pages/Dashboard';
import DayPage from './pages/DayPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import SettingsPage from './pages/SettingsPage';

// Создаем отдельный компонент для маршрутов, чтобы использовать хук useUser
const AppRoutes: React.FC = () => {
  // Компонент для защиты маршрутов, требующих аутентификации
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Используем хук useUser для проверки аутентификации
    const { isAuthenticated, isLoading } = useUser();
    const navigate = useNavigate();
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    
    // Устанавливаем таймаут для загрузки
    useEffect(() => {
      if (isLoading) {
        const timer = setTimeout(() => {
          setLoadingTimeout(true);
        }, 3000); // 3 секунды таймаут
        
        return () => clearTimeout(timer);
      }
    }, [isLoading]);
    
    // Если превышен таймаут загрузки, перенаправляем на страницу входа
    useEffect(() => {
      if (loadingTimeout) {
        navigate('/auth', { replace: true });
      }
    }, [loadingTimeout, navigate]);
    
    // Если данные загружаются, показываем заглушку
    if (isLoading && !loadingTimeout) {
      return (
        <div className="flex flex-col justify-center items-center min-h-screen">
          <div className="mb-4 text-xl">Загрузка...</div>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }
    
    return <>{children}</>;
  };
  
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
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
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <ProgressProvider>
          <Router>
            <ScrollToTop />
            <div className="app-container min-h-screen">
              <AppRoutes />
            </div>
          </Router>
        </ProgressProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
