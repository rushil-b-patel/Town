'use client';
import React from 'react';
import { useOfficeStore } from '../store/officeStore';
import { SKIN_COLORS, HAIR_COLORS, HAIR_STYLES, SHIRT_COLORS, ACCESSORIES } from '../types';
import type { AvatarConfig } from '../types';
import PixelAvatar from './PixelAvatar';

interface Props {
  config: AvatarConfig;
  onChange: (updates: Partial<AvatarConfig>) => void;
}

export default function AvatarCreator({ config, onChange }: Props) {
  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="flex justify-center">
        <div className="relative bg-[#1a1d27] rounded-xl p-6 border border-[#2e3347]">
          <PixelAvatar config={config} size={128} isActive={false} />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#242837] px-3 py-1 rounded-full border border-[#2e3347]">
            <span className="text-xs text-[#8b92a8]">Preview</span>
          </div>
        </div>
      </div>

      {/* Skin Color */}
      <Section title="Skin Tone">
        <div className="flex gap-2 flex-wrap">
          {SKIN_COLORS.map(c => (
            <ColorSwatch key={c} color={c} selected={config.skinColor === c} onClick={() => onChange({ skinColor: c })} />
          ))}
        </div>
      </Section>

      {/* Hair Style */}
      <Section title="Hair Style">
        <div className="flex gap-2 flex-wrap">
          {HAIR_STYLES.map(h => (
            <button key={h} onClick={() => onChange({ hairStyle: h })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${config.hairStyle === h ? 'bg-[#4A90D9] text-white' : 'bg-[#242837] text-[#8b92a8] hover:bg-[#2e3347]'}`}
            >
              {h.charAt(0).toUpperCase() + h.slice(1)}
            </button>
          ))}
        </div>
      </Section>

      {/* Hair Color */}
      <Section title="Hair Color">
        <div className="flex gap-2 flex-wrap">
          {HAIR_COLORS.map(c => (
            <ColorSwatch key={c} color={c} selected={config.hairColor === c} onClick={() => onChange({ hairColor: c })} />
          ))}
        </div>
      </Section>

      {/* Shirt Color */}
      <Section title="Shirt">
        <div className="flex gap-2 flex-wrap">
          {SHIRT_COLORS.map(c => (
            <ColorSwatch key={c} color={c} selected={config.shirtColor === c} onClick={() => onChange({ shirtColor: c })} />
          ))}
        </div>
      </Section>

      {/* Accessory */}
      <Section title="Accessory">
        <div className="flex gap-2 flex-wrap">
          {ACCESSORIES.map(a => (
            <button key={a} onClick={() => onChange({ accessory: a })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${config.accessory === a ? 'bg-[#4A90D9] text-white' : 'bg-[#242837] text-[#8b92a8] hover:bg-[#2e3347]'}`}
            >
              {a === 'none' ? 'None' : a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#8b92a8] mb-2">{title}</label>
      {children}
    </div>
  );
}

function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-8 h-8 rounded-lg transition-all ${selected ? 'ring-2 ring-[#4A90D9] ring-offset-2 ring-offset-[#0f1117] scale-110' : 'hover:scale-105'}`}
      style={{ backgroundColor: color }}
    />
  );
}
