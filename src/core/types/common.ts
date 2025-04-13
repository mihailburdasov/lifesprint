/**
 * Common types used throughout the application
 */

// Basic types
export type ID = string | number;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Component types
export interface WithClassName {
  className?: string;
}

export interface WithChildren {
  children: React.ReactNode;
}

export interface WithTestId {
  'data-testid'?: string;
}

// Common component props
export type BaseComponentProps = WithClassName & WithTestId;
export type ContainerComponentProps = BaseComponentProps & WithChildren;

// Function types
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;
export type ValueFunction<T> = (value: T) => void;
export type AsyncValueFunction<T> = (value: T) => Promise<void>;
