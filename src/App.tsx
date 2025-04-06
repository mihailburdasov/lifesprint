import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import ScrollToTop from './components/common/ScrollToTop';
import Dashboard from './pages/Dashboard';
import DayPage from './pages/DayPage';
import StepByStepDayPage from './pages/StepByStepDayPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import SettingsPage from './pages/SettingsPage';

// Улучшенный компонент для защиты маршрутов
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Проверяем, есть ли пользователь в localStorage
  const userId = localStorage.getItem('lifesprint_current_user_id');
  
  // Проверяем, существуют ли данные пользователя
  let userExists = false;
  
  if (userId) {
    try {
      const userJson = localStorage.getItem(`lifesprint_user_${userId}`);
      userExists = userJson !== null;
    } catch (error) {
      console.error('Ошибка при проверке данных пользователя:', error);
    }
  }
  
  // Если пользователь не авторизован или данные пользователя не найдены
  if (!userId || !userExists) {
    // Очищаем ID пользователя, если данные не найдены
    if (userId && !userExists) {
      localStorage.removeItem('lifesprint_current_user_id');
    }
    
    // Перенаправляем на страницу входа
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
