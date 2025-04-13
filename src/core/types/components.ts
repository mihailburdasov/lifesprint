/**
 * Types for components
 */

import { BaseComponentProps, ContainerComponentProps } from './common';

// Button props
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// Input props
export interface InputProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  disabled?: boolean;
  error?: string;
  label?: string;
  name?: string;
  required?: boolean;
  autoFocus?: boolean;
}

// Checkbox props
export interface CheckboxProps extends BaseComponentProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
}

// Progress indicator props
export interface ProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
}

// Card props
export interface CardProps extends ContainerComponentProps {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
}

// Dialog props
export interface DialogProps extends ContainerComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  closeOnOverlayClick?: boolean;
}

// Section props
export interface SectionProps extends ContainerComponentProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
}

// Icon props
export interface IconProps extends BaseComponentProps {
  size?: number;
  color?: string;
}

// Audio player props
export interface AudioPlayerProps extends BaseComponentProps {
  src: string;
  autoPlay?: boolean;
}
