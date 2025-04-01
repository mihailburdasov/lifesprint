import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProgressProvider } from './context/ProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import ScrollToTop from './components/common/ScrollToTop';
import Dashboard from './pages/Dashboard';
import DayPage from './pages/DayPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';

// Компонент для защиты маршрутов, требующих аутентификации
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Проверяем, есть ли пользователь в localStorage
  const isAuthenticated = localStorage.getItem('lifesprint_user') !== null;
  
  if (!isAuthenticated) {
    // Если пользователь не авторизован, перенаправляем на страницу входа
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
