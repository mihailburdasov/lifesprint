/**
 * Dialog component
 */

import React, { useEffect, useRef } from 'react';
import { DialogProps } from '../types/components';

/**
 * Dialog component
 */
export const Dialog: React.FC<DialogProps> = ({
  children,
  isOpen,
  onClose,
  title,
  description,
  closeOnOverlayClick = true,
  className = '',
  ...rest
}) => {
  // Ref for the dialog
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);
  
  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Prevent scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto focus:outline-none ${className}`}
        tabIndex={-1}
        {...rest}
      >
        <div className="flex justify-between items-start p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>}
          </div>
          
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
