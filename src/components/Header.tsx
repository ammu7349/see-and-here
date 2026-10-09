import React from 'react';
import { ActiveTab, SensoryPreferences } from '../types';
import { DEFAULT_LOGO_URL } from '../constants/presets';

interface HeaderProps {
  activeTab: ActiveTab;
  preferences: SensoryPreferences;
  onToggleContrast: () => void;
  onCycleTextSize: () => void;
  onToggleMic: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  preferences,
  onToggleContrast,
  onCycleTextSize,
  onToggleMic,
  onOpenProfile,
}) => {
  const tabTitles: Record<ActiveTab, string> = {
    live: 'Live Mode',
    radar: 'Sound Radar',
    history: 'History & Logs',
    settings: 'Sensory Settings',
  };

  const textSizeLabels: Record<SensoryPreferences['textSize'], string> = {
    normal: 'A',
    large: 'A+',
    xlarge: 'A++',
  };

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30">
      <div className="h-20 px-4 sm:px-6 flex items-center justify-between gap-2 max-w-4xl mx-auto">
        {/* Brand & Tab Title */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            alt="See & Hear Logo"
            className="h-8 w-auto object-contain flex-shrink-0"
            src={DEFAULT_LOGO_URL}
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl text-primary tracking-tight truncate">
                See & Hear
              </span>
              <span className="bg-secondary-container text-on-secondary-container text-[11px] leading-tight px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                Gemini
              </span>
            </div>
            <span className="text-sm text-on-surface-variant font-medium truncate">
              {tabTitles[activeTab]}
            </span>
          </div>
        </div>

        {/* Accessibility & Status Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Contrast Mode Toggle */}
          <button
            type="button"
            aria-label={`Toggle High Contrast Mode (currently ${preferences.highContrast ? 'On' : 'Off'})`}
            title="Toggle High Contrast Mode"
            onClick={onToggleContrast}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${
              preferences.highContrast
                ? 'bg-primary text-on-primary ring-2 ring-secondary'
                : 'bg-surface-container hover:bg-surface-container-high text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">contrast</span>
          </button>

          {/* Text Size Cycler */}
          <button
            type="button"
            aria-label={`Adjust Text Size (currently ${preferences.textSize.toUpperCase()})`}
            title={`Text Scale: ${textSizeLabels[preferences.textSize]}`}
            onClick={onCycleTextSize}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-primary transition-all relative font-bold"
          >
            <span className="material-symbols-outlined text-[24px]">format_size</span>
            <span className="absolute bottom-1 right-1 text-[9px] font-black leading-none bg-surface-container-highest px-1 rounded">
              {textSizeLabels[preferences.textSize]}
            </span>
          </button>

          {/* Mic Listening Status / Toggle */}
          <button
            type="button"
            aria-label={`Microphone listening status: ${preferences.micListening ? 'Active' : 'Paused'}`}
            title={`Acoustic Sensors: ${preferences.micListening ? 'Active' : 'Paused'}`}
            onClick={onToggleMic}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${
              preferences.micListening
                ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {preferences.micListening ? 'mic' : 'mic_off'}
            </span>
          </button>

          {/* Profile / Companion Info */}
          <button
            type="button"
            aria-label="Sensory Companion Status"
            title="Sensory Companion Online"
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-0.5 flex-shrink-0 hover:opacity-90 active:scale-95 transition-all text-on-primary"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};
