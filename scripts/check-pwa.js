const fs = require('fs');
const path = require('path');

// Функция для цветного вывода без зависимости от chalk
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  bold: {
    green: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[1m\x1b[33m${text}\x1b[0m`
  }
};

// Проверяем наличие необходимых файлов для PWA
const checkPWA = () => {
  console.log(colors.blue('Проверка PWA-функциональности...'));
  
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Список необходимых файлов
  const requiredFiles = [
    { path: 'manifest.json', name: 'Web App Manifest' },
    { path: 'service-worker.js', name: 'Service Worker' },
    { path: 'logo192.png', name: 'Иконка 192x192' },
    { path: 'logo512.png', name: 'Иконка 512x512' },
    { path: 'fallback.html', name: 'Страница офлайн-режима' },
    { path: 'screenshot1.png', name: 'Скриншот 1' },
    { path: 'screenshot2.png', name: 'Скриншот 2' }
  ];
  
  // Проверяем наличие каждого файла
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(publicDir, file.path);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      console.log(colors.green(`✓ ${file.name} (${file.path}) найден`));
    } else {
      console.log(colors.red(`✗ ${file.name} (${file.path}) не найден`));
      allFilesExist = false;
    }
  });
  
  // Проверяем содержимое manifest.json
  const manifestPath = path.join(publicDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Проверяем обязательные поля
      const requiredFields = [
        'name',
        'short_name',
        'icons',
        'start_url',
        'display',
        'theme_color',
        'background_color'
      ];
      
      let allFieldsExist = true;
      
      requiredFields.forEach(field => {
        if (manifest[field]) {
          console.log(colors.green(`✓ Поле '${field}' в manifest.json найдено`));
        } else {
          console.log(colors.red(`✗ Поле '${field}' в manifest.json отсутствует`));
          allFieldsExist = false;
        }
      });
      
      // Проверяем иконки
      if (manifest.icons && Array.isArray(manifest.icons)) {
        const has192 = manifest.icons.some(icon => icon.sizes && icon.sizes.includes('192x192'));
        const has512 = manifest.icons.some(icon => icon.sizes && icon.sizes.includes('512x512'));
        
        if (has192) {
          console.log(colors.green('✓ Иконка 192x192 указана в manifest.json'));
        } else {
          console.log(colors.red('✗ Иконка 192x192 не указана в manifest.json'));
          allFieldsExist = false;
        }
        
        if (has512) {
          console.log(colors.green('✓ Иконка 512x512 указана в manifest.json'));
        } else {
          console.log(colors.red('✗ Иконка 512x512 не указана в manifest.json'));
          allFieldsExist = false;
        }
      }
      
      if (allFieldsExist) {
        console.log(colors.green('✓ Manifest.json содержит все необходимые поля'));
      } else {
        console.log(colors.yellow('⚠ Manifest.json не содержит все необходимые поля'));
      }
    } catch (error) {
      console.log(colors.red(`✗ Ошибка при чтении manifest.json: ${error.message}`));
      allFilesExist = false;
    }
  }
  
  // Проверяем регистрацию Service Worker в index.tsx
  const indexPath = path.join(__dirname, '..', 'src', 'index.tsx');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (indexContent.includes('serviceWorker.register') || indexContent.includes('serviceWorker.register')) {
      console.log(colors.green('✓ Регистрация Service Worker найдена в index.tsx'));
    } else {
      console.log(colors.red('✗ Регистрация Service Worker не найдена в index.tsx'));
      allFilesExist = false;
    }
  }
  
  // Проверяем компонент InstallPWA
  const installPWAPath = path.join(__dirname, '..', 'src', 'components', 'common', 'InstallPWA.tsx');
  if (fs.existsSync(installPWAPath)) {
    console.log(colors.green('✓ Компонент InstallPWA найден'));
  } else {
    console.log(colors.red('✗ Компонент InstallPWA не найден'));
    allFilesExist = false;
  }
  
  // Итоговый результат
  if (allFilesExist) {
    console.log(colors.bold.green('\n✅ PWA-функциональность настроена корректно!'));
  } else {
    console.log(colors.bold.yellow('\n⚠ PWA-функциональность настроена с ошибками. Исправьте указанные проблемы.'));
  }
};

// Запускаем проверку
checkPWA();
