import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'zyra_onboarding_completed';

export function useOnboarding() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (completed !== 'true') {
      setIsOnboardingComplete(false);
      setTimeout(() => {
        setShowTour(true);
      }, 1000);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOnboardingComplete(true);
    setShowTour(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOnboardingComplete(true);
    setShowTour(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIsOnboardingComplete(false);
    setShowTour(true);
  };

  return {
    isOnboardingComplete,
    showTour,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
}
