/**
 * Section component
 */

import React from 'react';
import { SectionProps } from '../types/components';

/**
 * Section component
 */
export const Section: React.FC<SectionProps> = ({
  children,
  title,
  subtitle,
  headerRight,
  className = '',
  ...rest
}) => {
  // Base classes
  const baseClasses = 'mb-6';
  
  // Combine classes
  const sectionClasses = `${baseClasses} ${className}`;
  
  return (
    <section className={sectionClasses} {...rest}>
      {(title || subtitle || headerRight) && (
        <div className="flex justify-between items-start mb-4">
          <div>
            {title && <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>}
          </div>
          
          {headerRight && (
            <div className="ml-4">
              {headerRight}
            </div>
          )}
        </div>
      )}
      
      <div>
        {children}
      </div>
    </section>
  );
};

export default Section;
