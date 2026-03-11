'use client';

import React from 'react';
import { useOfficeStore } from '@/store/officeStore';
import LoginScreen from '@/components/LoginScreen';
import OnboardingFlow from '@/components/OnboardingFlow';
import OfficeCanvas from '@/components/OfficeCanvas';
import OfficeHUD from '@/components/OfficeHUD';
import ProfilePanel from '@/components/ProfilePanel';

export default function Home() {
  const view = useOfficeStore((s) => s.view);

  if (view === 'login') {
    return <LoginScreen />;
  }

  if (view === 'onboarding') {
    return <OnboardingFlow />;
  }

  // Office view
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0f1117] relative">
      <OfficeCanvas />
      <OfficeHUD />
      <ProfilePanel />
    </div>
  );
}
