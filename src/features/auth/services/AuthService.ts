import { supabase } from '../../../core/services/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  telegramNickname?: string;
}

export class AuthService {
  // Регистрация пользователя
  static async signUp(email: string, password: string, name: string, telegramNickname?: string): Promise<AuthUser | null> {
    console.log("🚀 Регистрируем пользователя...");
    
    try {
      // Регистрация с сохранением метаданных пользователя
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            telegram_nickname: telegramNickname
          }
        }
      });

      if (signUpError) {
        console.error("❌ Ошибка регистрации:", signUpError.message);
        throw signUpError;
      }

      if (!signUpData.user) {
        console.error("❌ Пользователь не создан.");
        return null;
      }

      console.log("✅ Пользователь зарегистрирован:", signUpData.user.id);
      console.log("📧 На указанный email отправлено письмо для подтверждения. После подтверждения пользователь сможет войти в систему.");

      // Возвращаем базовую информацию о пользователе
      return {
        id: signUpData.user.id,
        email: signUpData.user.email || '',
        name,
        telegramNickname,
      };
    } catch (error) {
      console.error('❌ Ошибка при регистрации:', error);
      throw error;
    }
  }

  // Вход пользователя
  static async signIn(email: string, password: string): Promise<AuthUser | null> {
    console.log("🔑 Выполняем вход пользователя...");
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("❌ Ошибка входа:", authError.message);
        throw authError;
      }

      if (!authData.user) {
        console.error("❌ Пользователь не найден.");
        return null;
      }

      console.log("✅ Вход выполнен успешно:", authData.user.id);

      // Получение профиля
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // Если профиль не существует (ошибка PGRST116), создаем его
      if (profileError && profileError.code === 'PGRST116') {
        console.log("ℹ️ Профиль пользователя не найден, создаем новый профиль");
        
        // Получаем метаданные пользователя
        const userData = authData.user.user_metadata || {};
        const userName = userData.name || 'Пользователь';
        const userTelegramNickname = userData.telegram_nickname || null;
        
        // Создаем профиль с данными из метаданных
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              name: userName,
              email: authData.user.email || '',
              telegram_nickname: userTelegramNickname,
            },
          ])
          .select();

        if (createProfileError) {
          console.error("❌ Ошибка создания профиля:", createProfileError.message);
          throw createProfileError;
        }

        console.log("✅ Профиль успешно создан при первом входе");
        
        return {
          id: authData.user.id,
          email: authData.user.email || '',
          name: userName,
          telegramNickname: userTelegramNickname,
        };
      } else if (profileError) {
        console.error("❌ Ошибка получения профиля:", profileError.message);
        throw profileError;
      }

      console.log("✅ Профиль получен успешно");

      return {
        id: authData.user.id,
        email: authData.user.email || '',
        name: profileData.name,
        telegramNickname: profileData.telegram_nickname,
      };
    } catch (error) {
      console.error('❌ Ошибка при входе:', error);
      throw error;
    }
  }

  // Выход пользователя
  static async signOut(): Promise<void> {
    console.log("🚪 Выполняем выход пользователя...");
    
    try {
      // Очищаем данные прогресса из localStorage при выходе
      localStorage.removeItem('lifesprint_progress');
      console.log("🧹 Данные прогресса очищены из localStorage");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ Ошибка выхода:", error.message);
        throw error;
      }
      
      console.log("✅ Выход выполнен успешно");
    } catch (error) {
      console.error('❌ Ошибка при выходе:', error);
      throw error;
    }
  }

  // Сброс пароля
  static async resetPassword(email: string): Promise<void> {
    console.log("🔄 Отправляем запрос на сброс пароля...");
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error("❌ Ошибка сброса пароля:", error.message);
        throw error;
      }
      
      console.log("✅ Запрос на сброс пароля отправлен успешно");
    } catch (error) {
      console.error('❌ Ошибка при сбросе пароля:', error);
      throw error;
    }
  }

  // Обновление пароля
  static async updatePassword(password: string): Promise<void> {
    console.log("🔐 Обновляем пароль...");
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        console.error("❌ Ошибка обновления пароля:", error.message);
        throw error;
      }
      
      console.log("✅ Пароль успешно обновлен");
    } catch (error) {
      console.error('❌ Ошибка при обновлении пароля:', error);
      throw error;
    }
  }

  // Получение текущего пользователя
  static async getCurrentUser(): Promise<AuthUser | null> {
    console.log("👤 Получаем данные текущего пользователя...");
    
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("❌ Ошибка получения пользователя:", authError.message);
        throw authError;
      }

      if (!authData.user) {
        console.log("ℹ️ Пользователь не авторизован");
        return null;
      }

      console.log("✅ Данные пользователя получены:", authData.user.id);

      // Получение профиля
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // Если профиль не существует (ошибка PGRST116), создаем его
      if (profileError && profileError.code === 'PGRST116') {
        console.log("ℹ️ Профиль пользователя не найден, создаем новый профиль");
        
        // Получаем метаданные пользователя
        const userData = authData.user.user_metadata || {};
        const userName = userData.name || 'Пользователь';
        const userTelegramNickname = userData.telegram_nickname || null;
        
        // Создаем профиль с данными из метаданных
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              name: userName,
              email: authData.user.email || '',
              telegram_nickname: userTelegramNickname,
            },
          ])
          .select();

        if (createProfileError) {
          console.error("❌ Ошибка создания профиля:", createProfileError.message);
          // Если не удалось создать профиль, возвращаем базовую информацию
          return {
            id: authData.user.id,
            email: authData.user.email || '',
          };
        }

        console.log("✅ Профиль успешно создан при получении текущего пользователя");
        
        return {
          id: authData.user.id,
          email: authData.user.email || '',
          name: userName,
          telegramNickname: userTelegramNickname,
        };
      } else if (profileError) {
        console.error("❌ Ошибка получения профиля:", profileError.message);
        throw profileError;
      }

      console.log("✅ Профиль пользователя получен успешно");

      return {
        id: authData.user.id,
        email: authData.user.email || '',
        name: profileData.name,
        telegramNickname: profileData.telegram_nickname,
      };
    } catch (error) {
      console.error('❌ Ошибка при получении текущего пользователя:', error);
      return null;
    }
  }
}
