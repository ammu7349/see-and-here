import React, { useState, useEffect } from 'react';
import { SensoryPreferences, SoundEvent } from '../types';
import { INITIAL_SOUND_EVENTS } from '../constants/presets';

interface RadarViewProps {
  preferences: SensoryPreferences;
  onUpdatePreferences: (updates: Partial<SensoryPreferences>) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const [events, setEvents] = useState<SoundEvent[]>(INITIAL_SOUND_EVENTS);
  const [currentDecibels, setCurrentDecibels] = useState<number>(46);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<SoundEvent | null>(null);

  // Subtle ambient fluctuation
  useEffect(() => {
    if (!preferences.micListening) return;

    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 6;
      setCurrentDecibels((prev) => {
        const next = Math.round(Math.max(32, Math.min(88, prev + delta)));
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [preferences.micListening]);

  // Audio tone cue synthesis
  const playAcousticCue = (category: SoundEvent['category'], urgent: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (urgent) {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch alert
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      } else if (category === 'voice') {
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      } else {
        osc.frequency.setValueAtTime(587, audioCtx.currentTime);
      }

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // AudioContext not allowed or not supported
    }

    if (preferences.hapticFeedback && window.navigator?.vibrate) {
      window.navigator.vibrate(urgent ? [60, 40, 60] : 30);
    }
  };

  const handleSimulateSound = (type: 'siren' | 'doorbell' | 'whisper') => {
    let newEvent: SoundEvent;
    if (type === 'siren') {
      newEvent = {
        id: `sound-${Date.now()}`,
        timestamp: 'Just now',
        label: 'Emergency Siren Nearby',
        category: 'emergency',
        decibels: 88,
        directionDegrees: 280, // Left 9 o'clock
        distanceEstimate: 'Approx. 25 feet west',
        urgent: true,
      };
    } else if (type === 'doorbell') {
      newEvent = {
        id: `sound-${Date.now()}`,
        timestamp: 'Just now',
        label: 'Front Door Entry Bell',
        category: 'emergency',
        decibels: 78,
        directionDegrees: 30, // 1 o'clock
        distanceEstimate: 'Approx. 9 feet front-right',
        urgent: true,
      };
    } else {
      newEvent = {
        id: `sound-${Date.now()}`,
        timestamp: 'Just now',
        label: 'Speaking Voice / Conversation',
        category: 'voice',
        decibels: 60,
        directionDegrees: 90, // 3 o'clock
        distanceEstimate: 'Approx. 5 feet to right',
        urgent: false,
      };
    }

    setEvents((prev) => [newEvent, ...prev.slice(0, 5)]);
    setSelectedEventId(newEvent.id);
    setActiveAlert(newEvent);
    setCurrentDecibels(newEvent.decibels);
    playAcousticCue(newEvent.category, newEvent.urgent);

    setTimeout(() => {
      setActiveAlert(null);
    }, 4000);
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-5 animate-in fade-in duration-200">
      {/* Title */}
      <section className="flex flex-col space-y-1">
        <h1 className="text-2xl sm:text-3xl text-primary tracking-tight font-extrabold leading-tight">
          Acoustic Directional Radar
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant font-medium leading-relaxed">
          360° spatial sound detection. Perceive ambient noises, doorbells, and footsteps around you.
        </p>
      </section>

      {/* Urgent Sound Banner if triggered */}
      {activeAlert && (
        <aside
          role="alert"
          aria-live="assertive"
          className="w-full bg-error-container text-on-error-container rounded-2xl p-4 flex items-center justify-between shadow-md border-2 border-error animate-bounce duration-1000"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[30px] text-error flex-shrink-0">
              warning
            </span>
            <div>
              <span className="font-bold text-base block text-error">
                {activeAlert.label} ({activeAlert.decibels} dB)
              </span>
              <p className="text-xs sm:text-sm font-medium">{activeAlert.distanceEstimate}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => playAcousticCue(activeAlert.category, true)}
            className="px-3 py-1.5 bg-error text-white text-xs font-bold rounded-lg shadow-sm"
          >
            Play Cue
          </button>
        </aside>
      )}

      {/* 360° Radar Compass Visualization */}
      <section
        aria-label="360 degree sound compass"
        className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-md flex flex-col items-center border border-outline-variant/30 space-y-4"
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">explore</span>
            Spatial Acoustic Compass
          </span>
          <span className="text-xs text-on-surface-variant font-medium">Top-Down 360°</span>
        </div>

        {/* Compass Canvas Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-surface-container-low border-2 border-primary/30 flex items-center justify-center overflow-hidden shadow-inner">
          {/* Concentric distance rings */}
          <div className="absolute w-48 h-48 rounded-full border border-dashed border-primary/20" />
          <div className="absolute w-32 h-32 rounded-full border border-primary/20" />
          <div className="absolute w-16 h-16 rounded-full border border-primary/25 bg-secondary-container/20" />

          {/* Compass Axis Lines */}
          <div className="absolute w-full h-[1px] bg-primary/10" />
          <div className="absolute h-full w-[1px] bg-primary/10" />

          {/* Cardinal Directions */}
          <span className="absolute top-2 text-[11px] font-black text-secondary">AHEAD (0°)</span>
          <span className="absolute bottom-2 text-[11px] font-black text-on-surface-variant">BEHIND (180°)</span>
          <span className="absolute right-2 text-[11px] font-black text-on-surface-variant">RIGHT (90°)</span>
          <span className="absolute left-2 text-[11px] font-black text-on-surface-variant">LEFT (270°)</span>

          {/* Rotating radar sweep ray */}
          {preferences.micListening && (
            <div
              className="absolute inset-0 origin-center pointer-events-none animate-spin"
              style={{
                animationDuration: '5s',
                animationTimingFunction: 'linear',
                background:
                  'conic-gradient(from 0deg, transparent 0deg, transparent 310deg, rgba(0, 168, 107, 0.18) 360deg)',
              }}
            />
          )}

          {/* User Center Node */}
          <div className="z-10 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>

          {/* Positioned Sound Beacons */}
          {events.map((ev) => {
            // Convert degrees to radians (0 is North/Top)
            const rad = ((ev.directionDegrees - 90) * Math.PI) / 180;
            const radius = ev.urgent ? 85 : 95; // pixels from center
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;

            const isSelected = selectedEventId === ev.id;

            return (
              <button
                key={ev.id}
                type="button"
                aria-label={`${ev.label}: ${ev.distanceEstimate}`}
                onClick={() => {
                  setSelectedEventId(ev.id);
                  playAcousticCue(ev.category, ev.urgent);
                }}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
                className={`absolute z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer ${
                  ev.urgent
                    ? 'bg-error text-white ring-4 ring-error/30 animate-pulse'
                    : ev.category === 'voice'
                    ? 'bg-primary text-on-primary ring-2 ring-primary/40'
                    : 'bg-secondary text-on-secondary ring-2 ring-secondary/40'
                } ${isSelected ? 'scale-125 ring-4' : 'scale-100'}`}
                title={`${ev.label} (${ev.decibels} dB)`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {ev.urgent ? 'priority_high' : ev.category === 'voice' ? 'record_voice_over' : 'hearing'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-on-surface-variant font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-error" />
            <span>High Urgency / Alert</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-secondary" />
            <span>Household Appliance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span>Speech / Footsteps</span>
          </div>
        </div>
      </section>

      {/* Live Decibel / Sound Pressure Gauge */}
      <section
        aria-label="Ambient Decibel Level"
        className="w-full bg-surface-container rounded-2xl p-4 shadow-sm space-y-2 border border-outline-variant/30"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              volume_up
            </span>
            Ambient Acoustic Level
          </span>
          <span className="text-lg font-black text-primary">{currentDecibels} dB</span>
        </div>

        {/* Meter Gauge */}
        <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              currentDecibels > 80
                ? 'bg-error'
                : currentDecibels > 65
                ? 'bg-amber-600'
                : 'bg-secondary'
            }`}
            style={{ width: `${Math.min(100, (currentDecibels / 100) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
          <span>Whisper (30 dB)</span>
          <span>Conversation (60 dB)</span>
          <span>Traffic / Siren (90 dB+)</span>
        </div>
      </section>

      {/* Simulation Triggers & Mic Toggle */}
      <section className="space-y-2">
        <span className="text-sm font-bold text-primary block">Test Acoustic Situations:</span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleSimulateSound('doorbell')}
            className="py-2.5 px-2 bg-surface-container-lowest hover:bg-surface-container text-primary rounded-xl font-bold text-xs sm:text-sm border border-outline-variant/50 shadow-sm flex flex-col items-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-secondary text-[20px]">doorbell</span>
            Doorbell
          </button>
          <button
            type="button"
            onClick={() => handleSimulateSound('siren')}
            className="py-2.5 px-2 bg-surface-container-lowest hover:bg-surface-container text-error rounded-xl font-bold text-xs sm:text-sm border border-outline-variant/50 shadow-sm flex flex-col items-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-error text-[20px]">e911_emergency</span>
            Siren Alert
          </button>
          <button
            type="button"
            onClick={() => handleSimulateSound('whisper')}
            className="py-2.5 px-2 bg-surface-container-lowest hover:bg-surface-container text-primary rounded-xl font-bold text-xs sm:text-sm border border-outline-variant/50 shadow-sm flex flex-col items-center gap-1 transition-all"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">
              record_voice_over
            </span>
            Footsteps/Voice
          </button>
        </div>
      </section>

      {/* Acoustic Event History Feed */}
      <section
        aria-label="Detected sound event log"
        className="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-md space-y-3 border border-outline-variant/30"
      >
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">list_alt</span>
            Recent Sound Signatures
          </span>
          <span className="text-xs text-on-surface-variant font-medium">Live Feed</span>
        </div>

        <div className="space-y-2">
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => {
                setSelectedEventId(ev.id);
                playAcousticCue(ev.category, ev.urgent);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedEventId === ev.id
                  ? 'bg-secondary-container/30 border-secondary ring-1 ring-secondary'
                  : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    ev.urgent
                      ? 'bg-error text-white'
                      : ev.category === 'voice'
                      ? 'bg-primary text-on-primary'
                      : 'bg-secondary text-on-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {ev.urgent ? 'notifications_active' : ev.category === 'voice' ? 'record_voice_over' : 'hearing'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary">{ev.label}</span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface">
                      {ev.decibels} dB
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant block">
                    {ev.distanceEstimate} • {ev.timestamp}
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label={`Play acoustic sound cue for ${ev.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  playAcousticCue(ev.category, ev.urgent);
                }}
                className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">volume_up</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
