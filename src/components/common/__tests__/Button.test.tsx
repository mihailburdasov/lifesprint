import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  // Тест на рендеринг кнопки с текстом
  test('renders with correct text', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });
  
  // Тест на вызов обработчика клика
  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  // Тест на отключенное состояние
  test('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    
    fireEvent.click(screen.getByText('Disabled Button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  // Тест на состояние загрузки
  test('shows loading indicator when isLoading is true', () => {
    render(<Button isLoading>Loading Button</Button>);
    
    // Проверяем наличие SVG-анимации загрузки
    expect(screen.getByText('Loading Button')).toBeInTheDocument();
    expect(document.querySelector('svg.animate-spin')).toBeInTheDocument();
  });
  
  // Тест на разные варианты кнопок
  test('applies correct classes for different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary Button</Button>);
    expect(screen.getByText('Primary Button')).toHaveClass('bg-primary');
    
    rerender(<Button variant="secondary">Secondary Button</Button>);
    expect(screen.getByText('Secondary Button')).toHaveClass('bg-secondary');
    
    rerender(<Button variant="outline">Outline Button</Button>);
    expect(screen.getByText('Outline Button')).toHaveClass('border');
    
    rerender(<Button variant="danger">Danger Button</Button>);
    expect(screen.getByText('Danger Button')).toHaveClass('bg-red-600');
  });
  
  // Тест на разные размеры кнопок
  test('applies correct classes for different sizes', () => {
    const { rerender } = render(<Button size="sm">Small Button</Button>);
    expect(screen.getByText('Small Button')).toHaveClass('text-sm');
    
    rerender(<Button size="md">Medium Button</Button>);
    expect(screen.getByText('Medium Button')).toHaveClass('min-h-[44px]');
    
    rerender(<Button size="lg">Large Button</Button>);
    expect(screen.getByText('Large Button')).toHaveClass('text-lg');
  });
  
  // Тест на полную ширину
  test('applies full width class when fullWidth is true', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    expect(screen.getByText('Full Width Button')).toHaveClass('w-full');
  });
  
  // Тест на активное состояние
  test('applies active state class when isActive is true', () => {
    render(<Button variant="primary" isActive>Active Button</Button>);
    expect(screen.getByText('Active Button')).toHaveClass('bg-opacity-80');
  });
  
  // Тест на иконки
  test('renders with left and right icons', () => {
    const leftIcon = <span data-testid="left-icon">L</span>;
    const rightIcon = <span data-testid="right-icon">R</span>;
    
    render(
      <Button leftIcon={leftIcon} rightIcon={rightIcon}>
        Icon Button
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('Icon Button')).toBeInTheDocument();
  });
  
  // Тест на доступность
  test('has correct accessibility attributes', () => {
    const { rerender } = render(<Button>Normal Button</Button>);
    expect(screen.getByText('Normal Button')).toHaveAttribute('type', 'button');
    
    rerender(<Button disabled>Disabled Button</Button>);
    const disabledButton = screen.getByText('Disabled Button');
    expect(disabledButton).toHaveAttribute('disabled');
    expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
    
    rerender(<Button isLoading>Loading Button</Button>);
    const loadingButton = screen.getByText('Loading Button');
    expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    
    rerender(<Button isActive>Active Button</Button>);
    expect(screen.getByText('Active Button')).toHaveAttribute('aria-pressed', 'true');
  });
});
