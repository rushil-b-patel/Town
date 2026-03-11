'use client';
import React from 'react';
import type { DeskConfig, DeskDecoration } from '../types';
import { DESK_STYLES, CHAIR_STYLES, MONITOR_SETUPS, DESK_DECORATIONS, DESK_COLOR_THEMES } from '../types';
import { PixelDesk, PixelChair, PixelMonitor, PixelDecoration } from './PixelFurniture';

interface Props {
  config: DeskConfig;
  onChange: (updates: Partial<DeskConfig>) => void;
}

export default function WorkspaceCustomizer({ config, onChange }: Props) {
  const toggleDecoration = (d: DeskDecoration) => {
    const has = config.decorations.includes(d);
    const next = has ? config.decorations.filter(x => x !== d) : [...config.decorations, d].slice(0, 4);
    onChange({ decorations: next });
  };

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="flex justify-center">
        <div className="relative bg-[#1a1d27] rounded-xl p-6 border border-[#2e3347]">
          <div className="flex items-end gap-3">
            <PixelChair style={config.chair} color={config.colorTheme} />
            <div className="flex flex-col items-center gap-1">
              <PixelMonitor setup={config.monitor} />
              <PixelDesk style={config.style} color="#8b6b4a" />
            </div>
            <div className="flex gap-1">
              {config.decorations.slice(0, 3).map(d => (
                <PixelDecoration key={d} type={d} size={20} />
              ))}
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#242837] px-3 py-1 rounded-full border border-[#2e3347]">
            <span className="text-xs text-[#8b92a8]">Preview</span>
          </div>
        </div>
      </div>

      {/* Desk Style */}
      <Section title="Desk Style">
        <div className="grid grid-cols-2 gap-2">
          {DESK_STYLES.map(({ value, label }) => (
            <OptionBtn key={value} label={label} selected={config.style === value} onClick={() => onChange({ style: value })} />
          ))}
        </div>
      </Section>

      {/* Chair */}
      <Section title="Chair">
        <div className="grid grid-cols-2 gap-2">
          {CHAIR_STYLES.map(({ value, label }) => (
            <OptionBtn key={value} label={label} selected={config.chair === value} onClick={() => onChange({ chair: value })} />
          ))}
        </div>
      </Section>

      {/* Monitor */}
      <Section title="Monitor Setup">
        <div className="grid grid-cols-2 gap-2">
          {MONITOR_SETUPS.map(({ value, label }) => (
            <OptionBtn key={value} label={label} selected={config.monitor === value} onClick={() => onChange({ monitor: value })} />
          ))}
        </div>
      </Section>

      {/* Color Theme */}
      <Section title="Color Theme">
        <div className="flex gap-2 flex-wrap">
          {DESK_COLOR_THEMES.map(c => (
            <button key={c} onClick={() => onChange({ colorTheme: c })}
              className={`w-8 h-8 rounded-lg transition-all ${config.colorTheme === c ? 'ring-2 ring-[#4A90D9] ring-offset-2 ring-offset-[#0f1117] scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Section>

      {/* Decorations */}
      <Section title="Desk Decorations (max 4)">
        <div className="grid grid-cols-2 gap-2">
          {DESK_DECORATIONS.map(({ value, label, icon }) => (
            <button key={value} onClick={() => toggleDecoration(value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${config.decorations.includes(value) ? 'bg-[#4A90D9]/20 text-[#4A90D9] border border-[#4A90D9]/40' : 'bg-[#242837] text-[#8b92a8] border border-transparent hover:bg-[#2e3347]'}`}
            >
              <span>{icon}</span>
              <span>{label}</span>
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

function OptionBtn({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all
        ${selected ? 'bg-[#4A90D9] text-white' : 'bg-[#242837] text-[#8b92a8] hover:bg-[#2e3347]'}`}
    >
      {label}
    </button>
  );
}
