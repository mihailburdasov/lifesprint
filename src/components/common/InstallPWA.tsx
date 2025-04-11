import React, { useState, useEffect } from 'react';
import Button from './Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const InstallPWA: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    // Сохраняем событие beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Проверяем, установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    // Обработчик события appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Показываем диалог установки
    installPrompt.prompt();
    
    // Ждем ответа пользователя
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };
  
  if (isInstalled || !installPrompt) return null;
  
  return (
    <div className="install-pwa-banner p-3 bg-primary bg-opacity-10 rounded-md mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Установите приложение</h3>
          <p className="text-sm text-text-light">Для быстрого доступа и работы офлайн</p>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleInstallClick}
        >
          Установить
        </Button>
      </div>
    </div>
  );
};

export default InstallPWA;
