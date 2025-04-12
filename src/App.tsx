import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ProgressProvider } from './context/ProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DayPage from './pages/DayPage';
import ProfilePage from './pages/ProfilePage';
import StepByStepDayPage from './pages/StepByStepDayPage';
import { useUser } from './context/UserContext';

// Компонент для защищенных маршрутов
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  
  if (!user) {
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
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Защищенные маршруты */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/day/:dayNumber" element={
                <ProtectedRoute>
                  <DayPage />
                </ProtectedRoute>
              } />
              <Route path="/day/:dayId/step/:stepId" element={
                <ProtectedRoute>
                  <StepByStepDayPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              {/* Перенаправление на страницу авторизации для всех остальных маршрутов */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </Router>
        </ProgressProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
