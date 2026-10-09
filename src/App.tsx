import React, { useState, useEffect } from 'react';
import { ActiveTab, HistoryScan, SensoryPreferences } from './types';
import { INITIAL_HISTORY_SCANS } from './constants/presets';
import { Header } from './components/Header';
import { LiveModeView } from './components/LiveModeView';
import { RadarView } from './components/RadarView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { BottomNav } from './components/BottomNav';

const DEFAULT_PREFERENCES: SensoryPreferences = {
  hapticFeedback: true,
  autoNarrate: false,
  highContrast: false,
  textSize: 'normal',
  speechRate: 1.0,
  voice: '',
  distanceUnits: 'feet',
  detailLevel: 'standard',
  micListening: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('live');

  // Load preferences from localStorage
  const [preferences, setPreferences] = useState<SensoryPreferences>(() => {
    try {
      const saved = localStorage.getItem('see_hear_preferences');
      if (saved) return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_PREFERENCES;
  });

  // Load history from localStorage
  const [historyScans, setHistoryScans] = useState<HistoryScan[]>(() => {
    try {
      const saved = localStorage.getItem('see_hear_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_HISTORY_SCANS;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sync preferences with localStorage and html class
  useEffect(() => {
    try {
      localStorage.setItem('see_hear_preferences', JSON.stringify(preferences));
    } catch (e) {}

    const htmlEl = document.documentElement;

    // Toggle high-contrast class
    if (preferences.highContrast) {
      htmlEl.classList.add('high-contrast');
    } else {
      htmlEl.classList.remove('high-contrast');
    }

    // Toggle text size class
    htmlEl.classList.remove('text-size-lg', 'text-size-xl');
    if (preferences.textSize === 'large') {
      htmlEl.classList.add('text-size-lg');
    } else if (preferences.textSize === 'xlarge') {
      htmlEl.classList.add('text-size-xl');
    }
  }, [preferences]);

  // Sync history with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('see_hear_history', JSON.stringify(historyScans));
    } catch (e) {}
  }, [historyScans]);

  const updatePreferences = (updates: Partial<SensoryPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const handleToggleContrast = () => {
    updatePreferences({ highContrast: !preferences.highContrast });
  };

  const handleCycleTextSize = () => {
    const cycle: Record<SensoryPreferences['textSize'], SensoryPreferences['textSize']> = {
      normal: 'large',
      large: 'xlarge',
      xlarge: 'normal',
    };
    updatePreferences({ textSize: cycle[preferences.textSize] });
  };

  const handleToggleMic = () => {
    updatePreferences({ micListening: !preferences.micListening });
  };

  const handleSaveToHistory = (
    scanData: Omit<HistoryScan, 'id' | 'timestamp' | 'displayTime'>
  ) => {
    const newScan: HistoryScan = {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      displayTime: 'Just now',
      ...scanData,
    };
    setHistoryScans((prev) => [newScan, ...prev]);
  };

  const handleClearHistory = () => {
    setHistoryScans([]);
  };

  const handleResetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <div className="bg-surface font-sans text-on-surface flex flex-col min-h-screen">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        preferences={preferences}
        onToggleContrast={handleToggleContrast}
        onCycleTextSize={handleCycleTextSize}
        onToggleMic={handleToggleMic}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Tab Viewport */}
      <main className="flex-1 flex flex-col relative w-full pt-24 pb-28 bg-surface px-4 sm:px-6 max-w-4xl mx-auto">
        {activeTab === 'live' && (
          <LiveModeView
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {activeTab === 'radar' && (
          <RadarView
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            scans={historyScans}
            preferences={preferences}
            onClearHistory={handleClearHistory}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
            onResetPreferences={handleResetPreferences}
          />
        )}
      </main>

      {/* Bottom Accessible Tab Bar */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Companion Status & Profile Info Modal */}
      {isProfileModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sensory Companion Status"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="bg-surface-container-lowest text-on-surface rounded-2xl w-full max-w-md p-6 shadow-2xl border-2 border-primary/20 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-surface-container-high">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-primary">Sensory Companion Profile</h3>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Tactile & Spatial Awareness Active
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase">
                  Connected Model
                </span>
                <p className="font-bold text-primary flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" />
                  Gemini 3.8 Flash (Multimodal Sensory Engine)
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase">
                  Accessibility Compliance
                </span>
                <p className="font-medium text-primary">
                  Engineered to WCAG AAA contrast guidelines with Atkinson Hyperlegible Next
                  typography.
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <span className="text-xs font-bold text-on-surface-variant uppercase">
                  Sensory Channels
                </span>
                <p className="font-medium text-primary">
                  Dual-channel: Real-time auditory speech narration + directional acoustic radar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
