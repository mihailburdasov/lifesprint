import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StepByStepDay } from '../components/steps';

const StepByStepDayPage: React.FC = () => {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const navigate = useNavigate();
  const dayNum = parseInt(dayNumber || '1', 10);

  useEffect(() => {
    if (!dayNumber) {
      navigate('/dashboard');
    }
  }, [dayNumber, navigate]);


  if (!dayNumber) {
    return null;
  }

  return (
    <div className="step-by-step-page">
      <StepByStepDay
        dayNumber={dayNum}
        isOpen={true}
        onClose={() => navigate('/')}
      />
    </div>
  );
};

export default StepByStepDayPage;
