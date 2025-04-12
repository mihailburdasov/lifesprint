import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaUser, FaBars, FaTimes, FaSun, FaMoon, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import SyncIndicator from '../common/SyncIndicator';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUser();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary bg-opacity-10 text-primary' : 'text-text-light-light dark:text-text-light-dark hover:bg-gray-100 dark:hover:bg-gray-800';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const MenuIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    if (isOpen) {
      return <FaTimes />;
    }
    return <FaBars />;
  };

  const NavItem: React.FC<{ icon: React.FC<{ className?: string }> }> = ({ icon: Icon }) => (
  <Icon className="mr-3" />
);

  return (
    <>
      {/* Mobile topbar with logo and menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 bg-surface-light dark:bg-surface-dark shadow-md">
        <Link to="/" className="text-xl font-bold text-primary">LifeSprint</Link>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-primary text-white shadow-sm"
        >
          <MenuIcon isOpen={isMobileMenuOpen} />
        </button>
      </div>
      
      {/* Sidebar for desktop and mobile */}
      <div 
        className={`sidebar bg-surface-light dark:bg-surface-dark h-full fixed shadow-md py-6 z-40 transition-all duration-300
          ${isMobileMenuOpen ? 'right-0 top-12' : '-right-64 top-0'} md:left-0 md:top-0 w-64 ${className}`}
      >
        <div className="px-6 mb-8">
          <Link to="/" className="block">
            <h1 className="text-xl font-bold text-primary">LifeSprint</h1>
            <p className="text-sm text-text-light">31-дневный путь трансформации</p>
          </Link>
          
          {isAuthenticated && user && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-text-light-light dark:text-text-light-dark">{user.email}</p>
              {user.telegramNickname && (
                <p className="text-sm text-text-light-light dark:text-text-light-dark">
                  Telegram: {user.telegramNickname}
                </p>
              )}
            </div>
          )}
        </div>
        
        <nav className="px-2">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/" 
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <NavItem icon={FaHome} />
                <span>Главная</span>
              </Link>
            </li>
            <li>
              <Link 
                to={`/day/${new Date().getDate() <= 28 ? new Date().getDate() : 28}`}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/day/' + (new Date().getDate() <= 28 ? new Date().getDate() : 28))}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <NavItem icon={FaCalendarAlt} />
                <span>Текущий день</span>
              </Link>
            </li>
            <li>
              {isAuthenticated ? (
                <Link 
                  to="/profile" 
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/profile')}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <NavItem icon={FaUser} />
                  <span>Профиль</span>
                </Link>
              ) : (
                <Link 
                  to="/auth" 
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/auth')}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <NavItem icon={FaUser} />
                  <span>Вход</span>
                </Link>
              )}
            </li>
            
            {isAuthenticated && (
              <li>
                <Link 
                  to="/settings" 
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/settings')}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <NavItem icon={FaCog} />
                  <span>Настройки</span>
                </Link>
              </li>
            )}
            
            {isAuthenticated && (
              <li>
                <button 
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    navigate('/auth');
                  }}
                  className="flex items-center w-full px-4 py-2 rounded-md transition-colors text-text-light-light dark:text-text-light-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <NavItem icon={FaSignOutAlt} />
                  <span>Выйти</span>
                </button>
              </li>
            )}
          </ul>
        </nav>
        
        {/* Sync status indicator */}
        {isAuthenticated && (
          <div className="px-6 mt-6">
            <SyncIndicator />
          </div>
        )}
        
        {/* Theme toggle button */}
        <div className="px-6 mt-4">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-text-light-light dark:text-text-light-dark">
              {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
            </span>
            <span className="sr-only">Переключить тему</span>
            {theme === 'light' ? (
              <FaMoon className="text-gray-600" />
            ) : (
              <FaSun className="text-yellow-400" />
            )}
          </button>
        </div>
        
        <div className="absolute bottom-6 px-6 w-full">
          <div className="text-sm text-text-light-light dark:text-text-light-dark">
            <p>© 2025 LifeSprint</p>
            <p>Версия 1.0.0</p>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
