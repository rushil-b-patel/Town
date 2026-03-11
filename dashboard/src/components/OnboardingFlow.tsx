'use client';
import React, { useState } from 'react';
import { useOfficeStore } from '../store/officeStore';
import type { OnboardingStep, OrgRole, PrivacyLevel } from '../types';
import { ROLE_LABELS } from '../types';
import AvatarCreator from './AvatarCreator';
import WorkspaceCustomizer from './WorkspaceCustomizer';
import PixelAvatar from './PixelAvatar';

const STEPS: { key: OnboardingStep; label: string; num: number }[] = [
  { key: 'profile', label: 'Profile', num: 1 },
  { key: 'avatar', label: 'Avatar', num: 2 },
  { key: 'workspace', label: 'Workspace', num: 3 },
];

export default function OnboardingFlow() {
  const {
    onboarding, setOnboardingStep,
    updateOnboardingProfile, updateOnboardingAvatar, updateOnboardingDesk,
    setOnboardingPrivacy, completeOnboarding,
  } = useOfficeStore();

  const currentIndex = STEPS.findIndex(s => s.key === onboarding.step);

  const next = () => {
    if (currentIndex < STEPS.length - 1) {
      setOnboardingStep(STEPS[currentIndex + 1].key);
    } else {
      completeOnboarding();
    }
  };

  const prev = () => {
    if (currentIndex > 0) setOnboardingStep(STEPS[currentIndex - 1].key);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Town</h1>
          <p className="text-sm text-[#8b92a8]">Let&apos;s set up your workspace</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${i <= currentIndex ? 'bg-[#4A90D9]/20 text-[#4A90D9]' : 'bg-[#242837] text-[#555d75]'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                  ${i <= currentIndex ? 'bg-[#4A90D9] text-white' : 'bg-[#2e3347] text-[#555d75]'}`}
                >{s.num}</span>
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < currentIndex ? 'bg-[#4A90D9]' : 'bg-[#2e3347]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="bg-[#1a1d27] rounded-2xl border border-[#2e3347] p-6 max-h-[60vh] overflow-y-auto">
          {onboarding.step === 'profile' && <ProfileStep />}
          {onboarding.step === 'avatar' && (
            <AvatarCreator config={onboarding.avatar} onChange={updateOnboardingAvatar} />
          )}
          {onboarding.step === 'workspace' && (
            <div className="space-y-5">
              <WorkspaceCustomizer config={onboarding.desk} onChange={updateOnboardingDesk} />
              <PrivacySection privacy={onboarding.privacyLevel} onChange={setOnboardingPrivacy} />
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex justify-between mt-6">
          <button onClick={prev} disabled={currentIndex === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#8b92a8] bg-[#242837] hover:bg-[#2e3347] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >← Back</button>
          <button onClick={next}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#4A90D9] hover:bg-[#3a80c9] transition-all"
          >
            {currentIndex === STEPS.length - 1 ? 'Enter Office →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileStep() {
  const { onboarding, updateOnboardingProfile } = useOfficeStore();
  const { profile } = onboarding;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-[#8b92a8] mb-2">Display Name</label>
        <input type="text" value={profile.displayName} onChange={e => updateOnboardingProfile({ displayName: e.target.value })}
          placeholder="Your name" className="w-full bg-[#242837] border border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555d75] focus:outline-none focus:border-[#4A90D9] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#8b92a8] mb-2">Trigram (3 letters)</label>
        <input type="text" value={profile.trigram} maxLength={3}
          onChange={e => updateOnboardingProfile({ trigram: e.target.value.toUpperCase().slice(0, 3) })}
          placeholder="ABC" className="w-full bg-[#242837] border border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555d75] focus:outline-none focus:border-[#4A90D9] transition-colors uppercase tracking-widest"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#8b92a8] mb-2">Role</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ROLE_LABELS) as OrgRole[]).map(r => (
            <button key={r} onClick={() => updateOnboardingProfile({ role: r })}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all
                ${profile.role === r ? 'bg-[#4A90D9] text-white' : 'bg-[#242837] text-[#8b92a8] hover:bg-[#2e3347]'}`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrivacySection({ privacy, onChange }: { privacy: PrivacyLevel; onChange: (p: PrivacyLevel) => void }) {
  const levels: { value: PrivacyLevel; label: string; desc: string }[] = [
    { value: 'public', label: 'Public', desc: 'Everyone can see your stats' },
    { value: 'team_only', label: 'Team Only', desc: 'Only your team sees stats' },
    { value: 'private', label: 'Private', desc: 'Only you can see stats' },
  ];

  return (
    <div>
      <label className="block text-xs font-medium text-[#8b92a8] mb-2">Privacy</label>
      <div className="space-y-2">
        {levels.map(l => (
          <button key={l.value} onClick={() => onChange(l.value)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
              ${privacy === l.value ? 'bg-[#4A90D9]/15 border border-[#4A90D9]/40' : 'bg-[#242837] border border-transparent hover:bg-[#2e3347]'}`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${privacy === l.value ? 'border-[#4A90D9]' : 'border-[#555d75]'}`}
            >
              {privacy === l.value && <div className="w-2 h-2 rounded-full bg-[#4A90D9]" />}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{l.label}</div>
              <div className="text-xs text-[#555d75]">{l.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
