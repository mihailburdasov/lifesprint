import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { DayContent } from '../regular';
import { useProgress } from '../../context/ProgressContext';

interface StepByStepDayProps {
  dayNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

const StepByStepDay: React.FC<StepByStepDayProps> = ({
  dayNumber,
  isOpen,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { reloadProgress } = useProgress();
  
  // Reload progress from localStorage when component mounts or becomes visible
  useEffect(() => {
    if (isOpen) {
      // This ensures we get the latest data from localStorage
      reloadProgress();
      console.log('Reloaded progress in StepByStepDay');
    }
  }, [isOpen, reloadProgress]);
  
  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };
  
  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  const handleComplete = () => {
    onClose();
    setCurrentStep(1);
  };
  
  const handleClose = () => {
    onClose();
    setCurrentStep(1);
  };
  
  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            <DayContent
              dayNumber={dayNumber}
              isStepMode={true}
              currentStep={currentStep}
              onStepComplete={handleComplete}
              onPreviousStep={handlePreviousStep}
              onNextStep={handleNextStep}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default StepByStepDay;
