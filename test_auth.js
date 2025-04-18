// Test script for Supabase authentication
// Run this script with Node.js to test the authentication flow

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user credentials - use generic test credentials
const testUser = {
  email: 'mihail.burdasov@gmail.com',
  password: 'Reset007!',
  name: 'Mihail',
  telegramNickname: '@testuser'
};

// Test functions
async function testSignUp() {
  console.log('🚀 Тестирование регистрации...');
  const { data, error } = await supabase.auth.signUp({
    email: testUser.email,
    password: testUser.password,
  });

  if (error) {
    console.error('❌ Ошибка регистрации:', error.message);
    return null;
  }

  console.log('✅ Регистрация успешна:', data.user.id);
  
  // Create profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: data.user.id,
        name: testUser.name,
        email: testUser.email,
        telegram_nickname: testUser.telegramNickname,
      },
    ])
    .select();

  if (profileError) {
    console.error('❌ Ошибка создания профиля:', profileError.message);
    return null;
  }

  console.log('✅ Профиль создан:', profileData);
  return data.user;
}

async function testSignIn() {
  console.log('🔑 Тестирование входа...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password,
  });

  if (error) {
    console.error('❌ Ошибка входа:', error.message);
    return null;
  }

  console.log('✅ Вход выполнен успешно:', data.user.id);
  return data.user;
}

async function testGetCurrentUser() {
  console.log('👤 Тестирование получения текущего пользователя...');
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('❌ Ошибка получения пользователя:', error.message);
    return null;
  }

  console.log('✅ Данные пользователя получены:', data.user.id);
  
  // Get profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error('❌ Ошибка получения профиля:', profileError.message);
    return null;
  }

  console.log('✅ Профиль получен:', profileData);
  return data.user;
}

async function testResetPassword() {
  console.log('🔄 Тестирование сброса пароля...');
  const { error } = await supabase.auth.resetPasswordForEmail(testUser.email, {
    redirectTo: `${process.env.REACT_APP_URL || 'http://localhost:3000'}/reset-password`,
  });

  if (error) {
    console.error('❌ Ошибка сброса пароля:', error.message);
    return false;
  }

  console.log('✅ Запрос на сброс пароля отправлен успешно');
  return true;
}

async function testUpdatePassword() {
  console.log('🔐 Тестирование обновления пароля...');
  const { error } = await supabase.auth.updateUser({
    password: 'NewPassword123!',
  });

  if (error) {
    console.error('❌ Ошибка обновления пароля:', error.message);
    return false;
  }

  console.log('✅ Пароль успешно обновлен');
  return true;
}

async function testSignOut() {
  console.log('🚪 Тестирование выхода...');
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('❌ Ошибка выхода:', error.message);
    return false;
  }

  console.log('✅ Выход выполнен успешно');
  return true;
}

// Run tests
async function runTests() {
  try {
    console.log('🧪 Запуск тестов аутентификации Supabase...');
    
    // Sign up
    const user = await testSignUp();
    if (!user) {
      console.log('ℹ️ Регистрация не удалась, пробуем войти с существующим пользователем...');
    }

    // Sign in
    const signedInUser = await testSignIn();
    if (!signedInUser) {
      console.error('❌ Вход не удался, прерываем тесты');
      return;
    }

    // Get current user
    const currentUser = await testGetCurrentUser();
    if (!currentUser) {
      console.error('❌ Получение текущего пользователя не удалось, прерываем тесты');
      return;
    }

    // Reset password (this will send an email)
    const resetPasswordResult = await testResetPassword();
    console.log(`${resetPasswordResult ? '✅' : '❌'} Тест сброса пароля завершен:`, resetPasswordResult);

    // Update password (this will only work if the user is signed in)
    const updatePasswordResult = await testUpdatePassword();
    console.log(`${updatePasswordResult ? '✅' : '❌'} Тест обновления пароля завершен:`, updatePasswordResult);

    // Sign out
    const signOutResult = await testSignOut();
    console.log(`${signOutResult ? '✅' : '❌'} Тест выхода завершен:`, signOutResult);

    console.log('🎉 Все тесты завершены!');
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

// Run the tests
runTests();
