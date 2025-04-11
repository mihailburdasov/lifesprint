import React, { memo, useMemo, useCallback } from 'react';
import { logService } from '../../utils/logService';

/**
 * Хук для мемоизации значения
 * @param value Значение для мемоизации
 * @param dependencies Дополнительные зависимости для пересчета значения
 * @returns Мемоизированное значение
 */
export function useMemoValue<T>(value: T, dependencies: React.DependencyList): T {
  // Добавляем value в массив зависимостей
  return useMemo(() => value, [value, ...dependencies]);
}

/**
 * Хок высшего порядка для мемоизации компонента с настраиваемой функцией сравнения пропсов
 * @param Component Компонент для мемоизации
 * @param propsAreEqual Функция сравнения пропсов (по умолчанию поверхностное сравнение)
 * @returns Мемоизированный компонент
 */
export function memoWithCustomCompare<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return memo(Component, propsAreEqual);
}

/**
 * Хок высшего порядка для мемоизации компонента с глубоким сравнением пропсов
 * @param Component Компонент для мемоизации
 * @returns Мемоизированный компонент
 */
export function memoWithDeepCompare<P extends object>(
  Component: React.ComponentType<P>
): React.MemoExoticComponent<React.ComponentType<P>> {
  return memo(Component, (prevProps, nextProps) => {
    try {
      // Глубокое сравнение пропсов
      return JSON.stringify(prevProps) === JSON.stringify(nextProps);
    } catch (error) {
      // В случае ошибки (например, циклические ссылки) возвращаем false
      logService.warn('Ошибка при глубоком сравнении пропсов', error);
      return false;
    }
  });
}

/**
 * Хук для создания стабильной функции обратного вызова
 * @param callback Функция обратного вызова
 * @param dependencies Дополнительные зависимости для пересчета функции
 * @returns Стабильная функция обратного вызова
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T {
  // Добавляем callback в массив зависимостей
  return useCallback(callback, [callback, ...dependencies]);
}

/**
 * Компонент для мемоизации дочерних компонентов
 * Используется для предотвращения ненужных перерисовок
 */
export const MemoizedChildren: React.FC<{
  children: React.ReactNode;
  dependencies?: React.DependencyList;
}> = memo(({ children, dependencies = [] }) => {
  // Мемоизируем дочерние компоненты с добавлением children в зависимости
  const memoizedChildren = useMemo(() => children, [children, ...dependencies]);
  
  return <>{memoizedChildren}</>;
});

/**
 * Компонент для ленивой загрузки других компонентов
 */
export const LazyComponent = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback: React.ReactNode = null
): React.LazyExoticComponent<React.ComponentType<P>> => {
  const LazyComp = React.lazy(importFunc);
  
  // Обертка для компонента с Suspense
  const WrappedComponent = (props: P) => (
    <React.Suspense fallback={fallback}>
      <LazyComp {...props as any} />
    </React.Suspense>
  );
  
  return React.lazy(() => Promise.resolve({ default: WrappedComponent }));
};

/**
 * Пример использования:
 * 
 * // Мемоизация компонента
 * const MemoizedButton = memo(Button);
 * 
 * // Мемоизация компонента с глубоким сравнением пропсов
 * const DeepMemoizedComponent = memoWithDeepCompare(MyComponent);
 * 
 * // Мемоизация значения
 * const memoizedValue = useMemoValue(expensiveValue, [dep1, dep2]);
 * 
 * // Стабильная функция обратного вызова
 * const handleClick = useStableCallback(() => {
 *   // Обработчик клика
 * }, [dep1, dep2]);
 * 
 * // Мемоизация дочерних компонентов
 * <MemoizedChildren dependencies={[dep1, dep2]}>
 *   <ExpensiveComponent />
 * </MemoizedChildren>
 * 
 * // Ленивая загрузка компонента
 * const LazyPage = LazyComponent(() => import('./pages/HeavyPage'));
 */
