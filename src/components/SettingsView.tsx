import React, { useState, useEffect } from 'react';
import { SensoryPreferences, TextSize } from '../types';

interface SettingsViewProps {
  preferences: SensoryPreferences;
  onUpdatePreferences: (updates: Partial<SensoryPreferences>) => void;
  onResetPreferences: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onResetPreferences,
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [apiStatus, setApiStatus] = useState<{ hasApiKey: boolean; model: string }>({
    hasApiKey: false,
    model: 'gemini-3.8-flash',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v.filter((voice) => voice.lang.startsWith('en')));
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Check server status
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setApiStatus(data))
      .catch(() => {});
  }, []);

  const testVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      'See and Hear companion speech test. Tactile clarity verified at 8 feet.'
    );
    utterance.rate = preferences.speechRate;
    if (preferences.voice) {
      const v = availableVoices.find((voice) => voice.name === preferences.voice);
      if (v) utterance.voice = v;
    }
    window.speechSynthesis.speak(utterance);
  };

  const testHaptic = (pattern: number | number[]) => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-5 animate-in fade-in duration-200">
      {/* Title */}
      <section className="flex flex-col space-y-1">
        <h1 className="text-2xl sm:text-3xl text-primary tracking-tight font-extrabold leading-tight">
          Sensory & Tactile Settings
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant font-medium leading-relaxed">
          Customize high-contrast display, speech synthesis, haptics, and spatial perception units.
        </p>
      </section>

      {/* Visual Accessibility Section */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 border border-outline-variant/30">
        <span className="text-base font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[22px]">visibility</span>
          Display & Legibility
        </span>

        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl">
          <div className="flex flex-col pr-2">
            <span className="text-sm font-bold text-primary">Ultra High Contrast Mode</span>
            <span className="text-xs sm:text-sm text-on-surface-variant">
              WCAG AAA deep black background with luminous emerald anchors
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.highContrast}
            onClick={() => onUpdatePreferences({ highContrast: !preferences.highContrast })}
            className={`w-14 h-8 rounded-full p-1 relative transition-colors flex items-center flex-shrink-0 cursor-pointer ${
              preferences.highContrast ? 'bg-primary' : 'bg-surface-container-highest'
            }`}
          >
            <span
              className={`w-6 h-6 bg-surface-container-lowest rounded-full shadow-md transform transition-transform ${
                preferences.highContrast ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Text Size Scale */}
        <div className="flex flex-col space-y-2 p-3.5 bg-surface-container-low rounded-xl">
          <span className="text-sm font-bold text-primary">Text Scaling Multiplier</span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'normal', label: 'Standard (100%)' },
                { id: 'large', label: 'Large (112%)' },
                { id: 'xlarge', label: 'Extra (125%)' },
              ] as { id: TextSize; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdatePreferences({ textSize: opt.id })}
                className={`py-2 px-1 text-center rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  preferences.textSize === opt.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Auditory Narration Section */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 border border-outline-variant/30">
        <span className="text-base font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[22px]">volume_up</span>
          Auditory Narration & Speech
        </span>

        {/* Speech Speed */}
        <div className="space-y-2 p-3.5 bg-surface-container-low rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary">Narration Speed</span>
            <span className="text-sm font-black text-secondary">{preferences.speechRate}x</span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.75"
            step="0.25"
            value={preferences.speechRate}
            onChange={(e) => onUpdatePreferences({ speechRate: parseFloat(e.target.value) })}
            className="w-full accent-secondary"
          />
          <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
            <span>0.75x (Deliberate)</span>
            <span>1.0x (Normal)</span>
            <span>1.75x (Rapid)</span>
          </div>
        </div>

        {/* Voice Selector */}
        {availableVoices.length > 0 && (
          <div className="space-y-1.5 p-3.5 bg-surface-container-low rounded-xl">
            <label className="text-sm font-bold text-primary block">Screen Voice Persona</label>
            <select
              value={preferences.voice}
              onChange={(e) => onUpdatePreferences({ voice: e.target.value })}
              className="w-full h-11 px-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm font-medium text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Default Accessible System Voice</option>
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Test Speech Voice Button */}
        <button
          type="button"
          onClick={testVoice}
          className="w-full h-12 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
          Test Speech Synthesis Voice
        </button>
      </section>

      {/* Tactile & Haptic Feedback Section */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 border border-outline-variant/30">
        <span className="text-base font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[22px]">vibration</span>
          Tactile & Haptic Engine
        </span>

        <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl">
          <div className="flex flex-col pr-2">
            <span className="text-sm font-bold text-primary">Obstacle Vibration Pulses</span>
            <span className="text-xs sm:text-sm text-on-surface-variant">
              Fires tactile pulses upon obstacle identification or hazard alert
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.hapticFeedback}
            onClick={() => onUpdatePreferences({ hapticFeedback: !preferences.hapticFeedback })}
            className={`w-14 h-8 rounded-full p-1 relative transition-colors flex items-center flex-shrink-0 cursor-pointer ${
              preferences.hapticFeedback ? 'bg-primary' : 'bg-surface-container-highest'
            }`}
          >
            <span
              className={`w-6 h-6 bg-surface-container-lowest rounded-full shadow-md transform transition-transform ${
                preferences.hapticFeedback ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => testHaptic([30, 20, 30])}
            className="h-11 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">fingerprint</span>
            Test Tap Pattern
          </button>
          <button
            type="button"
            onClick={() => testHaptic([80, 40, 80])}
            className="h-11 bg-surface-container hover:bg-surface-container-high text-error rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Test Hazard Pattern
          </button>
        </div>
      </section>

      {/* Spatial Units & Perception Section */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 border border-outline-variant/30">
        <span className="text-base font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[22px]">straighten</span>
          Spatial Perception & Measurements
        </span>

        {/* Units */}
        <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl">
          <div>
            <span className="text-sm font-bold text-primary">Distance Units</span>
            <span className="text-xs text-on-surface-variant block">
              Auditory distance announcement format
            </span>
          </div>
          <div className="flex bg-surface-container-lowest rounded-lg p-1 border border-outline-variant/40">
            <button
              type="button"
              onClick={() => onUpdatePreferences({ distanceUnits: 'feet' })}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                preferences.distanceUnits === 'feet'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              Feet
            </button>
            <button
              type="button"
              onClick={() => onUpdatePreferences({ distanceUnits: 'meters' })}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                preferences.distanceUnits === 'meters'
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              Meters
            </button>
          </div>
        </div>

        {/* Detail Level */}
        <div className="space-y-1.5 p-3.5 bg-surface-container-low rounded-xl">
          <span className="text-sm font-bold text-primary block">Perception Detail Level</span>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'concise', label: 'Concise' },
                { id: 'standard', label: 'Standard' },
                { id: 'in-depth', label: 'In-Depth' },
              ] as { id: SensoryPreferences['detailLevel']; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdatePreferences({ detailLevel: opt.id })}
                className={`py-2 text-center rounded-lg text-xs font-bold transition-all ${
                  preferences.detailLevel === opt.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Companion Engine Status */}
      <section className="w-full bg-surface-container rounded-2xl p-4 shadow-sm border border-outline-variant/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              smart_toy
            </span>
            Gemini Vision Architecture
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
            Online
          </span>
        </div>
        <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
          Integrated with <strong className="text-primary font-bold">Gemini 3.8 Flash</strong> via
          server proxy for rapid tactile scene segmentation and low-latency auditory descriptions.
        </p>
      </section>

      {/* Reset Defaults */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onResetPreferences}
          className="text-xs font-bold text-on-surface-variant hover:text-error py-2 px-3 rounded-lg hover:bg-surface-container transition-colors"
        >
          Reset All Sensory Preferences to Default
        </button>
      </div>
    </div>
  );
};
