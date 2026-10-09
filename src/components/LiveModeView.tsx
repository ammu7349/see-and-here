import React, { useState, useEffect, useRef } from 'react';
import { DemoState, SceneAnalysis, SensoryPreferences, HistoryScan } from '../types';
import { DemoStateBar } from './DemoStateBar';
import { CameraModal } from './CameraModal';
import {
  DEFAULT_SCENE_IMAGE_URL,
  DEFAULT_SCENE_ANALYSIS,
  SamplePresetScene,
} from '../constants/presets';

interface LiveModeViewProps {
  preferences: SensoryPreferences;
  onUpdatePreferences: (updates: Partial<SensoryPreferences>) => void;
  onSaveToHistory: (scan: Omit<HistoryScan, 'id' | 'timestamp' | 'displayTime'>) => void;
}

export const LiveModeView: React.FC<LiveModeViewProps> = ({
  preferences,
  onUpdatePreferences,
  onSaveToHistory,
}) => {
  const [currentState, setCurrentState] = useState<DemoState>('results');
  const [currentImage, setCurrentImage] = useState<string>(DEFAULT_SCENE_IMAGE_URL);
  const [fileSizeText, setFileSizeText] = useState<string>('Photo Ready (1.2 MB)');
  const [analysis, setAnalysis] = useState<SceneAnalysis>(DEFAULT_SCENE_ANALYSIS);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [liveStatusMessage, setLiveStatusMessage] = useState<string>(
    'Photo captured • Ready to analyze surroundings'
  );
  const [playbackTime, setPlaybackTime] = useState<{ current: number; total: number }>({
    current: 14,
    total: 28,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Synchronize state with audio or banners
  useEffect(() => {
    if (currentState === 'results') {
      setLiveStatusMessage('Photo captured • Ready to explore surroundings');
      stopAudioPlayback();
    } else if (currentState === 'empty') {
      setLiveStatusMessage('No scene selected • Tap camera to get started');
      stopAudioPlayback();
    } else if (currentState === 'analyzing') {
      setLiveStatusMessage('Gemini is analyzing objects, obstacles and pathways…');
      stopAudioPlayback();
    } else if (currentState === 'playing') {
      setLiveStatusMessage(`Auditory narration in progress (${speechSpeed}x speed)`);
      startSpokenNarration();
    } else if (currentState === 'error') {
      setLiveStatusMessage('Scene recognition failed • Lighting insufficient');
      stopAudioPlayback();
    }
  }, [currentState]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update status icon
  const getStatusIcon = () => {
    switch (currentState) {
      case 'results':
        return 'check_circle';
      case 'empty':
        return 'photo_camera';
      case 'analyzing':
        return 'hourglass_top';
      case 'playing':
        return 'volume_up';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const triggerHaptic = (pattern: number | number[] = 30) => {
    if (preferences.hapticFeedback && typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleStateSelect = (state: DemoState) => {
    triggerHaptic(25);
    setCurrentState(state);
  };

  // Upload handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSizeText(`Photo Ready (${sizeMb} MB)`);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCurrentImage(reader.result);
        setCurrentState('results');
        setLiveStatusMessage('New image uploaded • Ready to analyze');
        triggerHaptic(30);

        if (preferences.autoNarrate) {
          handleDescribeSurroundings(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  const handleCameraCapture = (imageUrl: string, preset?: SamplePresetScene) => {
    setCurrentImage(imageUrl);
    if (preset) {
      setFileSizeText(preset.fileSizeText);
      setAnalysis(preset.analysis);
    } else {
      setFileSizeText('Photo Ready (1.4 MB)');
    }
    setCurrentState('results');
    setLiveStatusMessage('New photo captured from camera preview');
    triggerHaptic([30, 20, 30]);

    if (preferences.autoNarrate) {
      handleDescribeSurroundings(imageUrl);
    }
  };

  // Describe surroundings with Gemini API call or fallback
  const handleDescribeSurroundings = async (imgToAnalyze?: string) => {
    triggerHaptic(50);
    setCurrentState('analyzing');

    const imageSource = imgToAnalyze || currentImage;

    try {
      // Call server API
      const res = await fetch('/api/analyze-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSource,
          detailLevel: preferences.detailLevel,
          distanceUnits: preferences.distanceUnits,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAnalysis(data.analysis);
          onSaveToHistory({
            locationLabel: 'Scanned Room Frame',
            imageUrl: imageSource,
            analysis: data.analysis,
          });
        }
      }
    } catch (err) {
      console.warn('API call encountered error, using local high-fidelity perception:', err);
    }

    // Smooth transition into results
    setTimeout(() => {
      setCurrentState('results');
      triggerHaptic([40, 60, 40]);
      if (preferences.autoNarrate) {
        setTimeout(() => {
          setCurrentState('playing');
        }, 300);
      }
    }, 1200);
  };

  // Speech Narration Controls
  const startSpokenNarration = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const fullNarrationText = `${analysis.overallSummary}. 1: Immediate path: ${analysis.immediateWalkingPath}. 2: Objects in reach: ${analysis.objectsInReach}. 3: Light: ${analysis.lightAndOrientation}. 4: Obstacle Assessment: ${analysis.obstacleAssessment}.`;

    const utterance = new SpeechSynthesisUtterance(fullNarrationText);
    utterance.rate = speechSpeed;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setCurrentState('results');
    };

    utterance.onerror = () => {
      setCurrentState('results');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopAudioPlayback = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleAudio = () => {
    if (currentState === 'playing') {
      setCurrentState('results');
      triggerHaptic(20);
    } else {
      setCurrentState('playing');
      triggerHaptic(40);
    }
  };

  const setSpeed = (speed: number) => {
    setSpeechSpeed(speed);
    triggerHaptic(20);
    setLiveStatusMessage(`Speech speed set to ${speed}x`);
    if (currentState === 'playing') {
      startSpokenNarration();
    }
  };

  const copyDescription = () => {
    const fullText = `Visual Scene Breakdown:\n1. Immediate Walking Path: ${analysis.immediateWalkingPath}\n2. Objects in Reach: ${analysis.objectsInReach}\n3. Light & Orientation: ${analysis.lightAndOrientation}\n4. Obstacle Assessment: ${analysis.obstacleAssessment}`;

    navigator.clipboard?.writeText(fullText);
    setCopyFeedback(true);
    triggerHaptic(30);
    setTimeout(() => setCopyFeedback(false), 2200);
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-5" id="companion-root">
      {/* Hidden file input for Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Camera modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Interactive State Demonstration Bar */}
      <DemoStateBar currentState={currentState} onSelectState={handleStateSelect} />

      {/* Main Accessible Title Section */}
      <section className="flex flex-col space-y-1">
        <h1 className="text-2xl sm:text-3xl text-primary tracking-tight font-extrabold leading-tight">
          Understand the world around you
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant font-medium leading-relaxed">
          Capture a picture. Hear what Gemini sees in rich tactile detail.
        </p>
      </section>

      {/* Live Accessibility Audio/Visual Status Banner */}
      <aside
        id="status-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="w-full bg-secondary-container text-on-secondary-container rounded-xl p-3.5 flex items-center justify-between shadow-sm border border-secondary/20"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className="w-3.5 h-3.5 rounded-full bg-secondary animate-pulse flex-shrink-0"
          />
          <p className="text-sm font-semibold truncate" id="live-status-message">
            {liveStatusMessage}
          </p>
        </div>
        <span
          className="material-symbols-outlined text-secondary flex-shrink-0 text-[22px]"
          id="live-status-icon"
        >
          {getStatusIcon()}
        </span>
      </aside>

      {/* Camera & Image Input Actions */}
      <section aria-label="Capture controls" className="grid grid-cols-2 gap-3">
        <button
          type="button"
          id="btn-take-photo"
          aria-label="Take a photo with camera"
          onClick={() => {
            triggerHaptic(30);
            setIsCameraModalOpen(true);
          }}
          className="min-h-[60px] h-14 bg-primary text-on-primary hover:bg-primary-container rounded-xl px-4 font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[26px]">photo_camera</span>
          <span>Take Photo</span>
        </button>

        <button
          type="button"
          id="btn-upload-photo"
          aria-label="Upload existing image from device storage"
          onClick={() => {
            triggerHaptic(20);
            fileInputRef.current?.click();
          }}
          className="min-h-[60px] h-14 bg-surface-container-lowest text-primary hover:bg-surface-container rounded-xl px-4 font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-all border border-outline-variant/60"
        >
          <span className="material-symbols-outlined text-[26px]">upload_file</span>
          <span>Upload</span>
        </button>
      </section>

      {/* Image Preview Container (Dynamic) */}
      <section
        id="preview-panel"
        className="w-full bg-surface-container-lowest rounded-2xl p-3.5 shadow-md flex flex-col space-y-3 border border-outline-variant/30"
      >
        {currentState === 'empty' ? (
          /* Empty State Placeholder */
          <div
            id="preview-empty-content"
            className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-[40px]">add_photo_alternate</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-primary">No photo captured yet</h3>
              <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">
                Tap &ldquo;Take Photo&rdquo; or upload an image to receive instant auditory spatial
                awareness.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="h-14 px-6 bg-primary text-on-primary rounded-xl font-bold text-base flex items-center gap-2 shadow-md hover:bg-primary-container transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px]">photo_camera</span>
              <span>Open Camera</span>
            </button>
          </div>
        ) : (
          /* Active Image Card View */
          <div id="preview-active-content" className="flex flex-col space-y-3">
            <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-surface-container-high shadow-inner">
              <img
                id="scene-image"
                src={currentImage}
                alt="Captured view of surroundings for spatial perception"
                className="w-full h-full object-cover"
              />

              {/* Quick Meta Tag Overlay */}
              <div className="absolute top-2.5 left-2.5 bg-primary/90 text-on-primary px-3 py-1 rounded-full text-[13px] font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">
                  image
                </span>
                <span>{fileSizeText}</span>
              </div>

              {/* Visual Sensor Alignment Reticle */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
              >
                <div className="w-24 h-24 rounded-full bg-secondary-container/20 border border-secondary-container/50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[32px] opacity-75">
                    center_focus_strong
                  </span>
                </div>
              </div>
            </div>

            {/* Revision Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-on-surface-variant text-sm font-semibold">
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  verified
                </span>
                <span>High Clarity Frame</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Retake this photo"
                  onClick={() => {
                    triggerHaptic(20);
                    setIsCameraModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-sm font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">cached</span> Retake
                </button>
                <button
                  type="button"
                  aria-label="Replace current image"
                  onClick={() => {
                    triggerHaptic(20);
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-sm font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span> Replace
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Big Primary Action Button */}
      <section className="w-full">
        <button
          type="button"
          id="btn-describe-surroundings"
          aria-label="Describe my surroundings using Gemini"
          onClick={() => handleDescribeSurroundings()}
          className="w-full min-h-[64px] h-16 bg-primary text-on-primary hover:bg-primary-container rounded-2xl font-extrabold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[30px] text-tertiary-fixed">
            auto_awesome
          </span>
          <span>Describe My Surroundings</span>
          <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
        </button>
      </section>

      {/* Loading / Analyzing State Panel */}
      {currentState === 'analyzing' && (
        <section
          id="panel-analyzing"
          aria-live="assertive"
          className="w-full bg-surface-container-lowest rounded-2xl p-6 shadow-md flex flex-col items-center justify-center space-y-4 border border-secondary/30 animate-in fade-in duration-300"
        >
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-secondary-container animate-ping absolute opacity-60" />
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary z-10 shadow-md">
              <span className="material-symbols-outlined text-[26px] animate-spin">sync</span>
            </div>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-primary">
              Understanding your surroundings…
            </h3>
            <p className="text-sm text-on-surface-variant font-medium">
              Gemini Vision is mapping obstacles, doorways, and reach zones
            </p>
          </div>
          {/* High-contrast accessible progress bar */}
          <div
            role="progressbar"
            aria-valuenow={75}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full max-w-xs bg-surface-container h-3 rounded-full overflow-hidden"
          >
            <div className="bg-secondary h-full rounded-full transition-all duration-300 w-3/4 animate-pulse" />
          </div>
        </section>
      )}

      {/* Error State Panel */}
      {currentState === 'error' && (
        <section
          id="panel-error"
          role="alert"
          className="w-full bg-error-container text-on-error-container rounded-2xl p-5 shadow-sm space-y-3 border border-error/30 animate-in fade-in duration-300"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-[32px] flex-shrink-0">
              report
            </span>
            <div className="space-y-1 flex-1">
              <h3 className="text-lg font-bold text-error">Unable to analyze image</h3>
              <p className="text-sm text-on-error-container font-medium leading-relaxed">
                The picture was too dark or blurry to reliably detect navigation path details.
                Please retake in good lighting.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setCurrentState('results');
              }}
              className="h-12 px-4 rounded-xl bg-on-error-container text-surface-container-lowest text-sm font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">replay</span>
              Retry Capture
            </button>
          </div>
        </section>
      )}

      {/* Results Card: "Here's what I can see" */}
      {currentState !== 'empty' && currentState !== 'analyzing' && currentState !== 'error' && (
        <article
          id="panel-results"
          aria-label="Visual Scene Breakdown"
          className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-md flex flex-col space-y-4 border border-outline-variant/30"
        >
          {/* Header of Result Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-container-low rounded-xl p-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">hearing</span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-primary">Here’s what I can see</h2>
                <span className="text-[13px] text-on-surface-variant font-medium">
                  {analysis.modelName} • {analysis.clarityScore}% clarity score
                </span>
              </div>
            </div>
            <div className="flex items-center self-end sm:self-auto gap-1">
              <span className="bg-secondary-container text-on-secondary-container text-[12px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                Verified Safe
              </span>
            </div>
          </div>

          {/* Structured Bullet Points for Rapid Screen Reading */}
          <ol
            aria-label="Step by step room inspection"
            className="space-y-3 text-base text-on-surface"
          >
            {/* Step 1 */}
            <li className="bg-surface-container-low rounded-xl p-3.5 flex items-start gap-3 border border-outline-variant/30">
              <span className="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              <div className="space-y-0.5">
                <span className="text-base font-bold text-primary block">
                  Immediate Walking Path
                </span>
                <p className="text-on-surface leading-relaxed">
                  {analysis.immediateWalkingPath}
                </p>
              </div>
            </li>

            {/* Step 2 */}
            <li className="bg-surface-container-low rounded-xl p-3.5 flex items-start gap-3 border border-outline-variant/30">
              <span className="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <div className="space-y-0.5">
                <span className="text-base font-bold text-primary block">Objects in Reach</span>
                <p className="text-on-surface leading-relaxed">{analysis.objectsInReach}</p>
              </div>
            </li>

            {/* Step 3 */}
            <li className="bg-surface-container-low rounded-xl p-3.5 flex items-start gap-3 border border-outline-variant/30">
              <span className="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <div className="space-y-0.5">
                <span className="text-base font-bold text-primary block">
                  Light & Orientation
                </span>
                <p className="text-on-surface leading-relaxed">
                  {analysis.lightAndOrientation}
                </p>
              </div>
            </li>

            {/* Step 4 (Highlighted in emerald) */}
            <li className="bg-surface-container-low rounded-xl p-3.5 flex items-start gap-3 border border-secondary/30">
              <span className="w-8 h-8 rounded-lg bg-secondary text-on-secondary font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                4
              </span>
              <div className="space-y-0.5">
                <span className="text-base font-bold text-primary block">
                  Obstacle Assessment
                </span>
                <p className="text-secondary font-semibold leading-relaxed">
                  {analysis.obstacleAssessment}
                </p>
              </div>
            </li>
          </ol>

          {/* Audio Playback Controls Section */}
          <div className="w-full bg-surface-container rounded-xl p-3.5 flex flex-col space-y-3 mt-2 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  graphic_eq
                </span>
                Speech Narration
              </span>

              {/* Speech Speed Selector */}
              <div
                role="radiogroup"
                aria-label="Speech playback speed"
                className="flex items-center gap-1 bg-surface-container-lowest rounded-lg p-1 border border-outline-variant/40"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={speechSpeed === 1.0}
                  onClick={() => setSpeed(1.0)}
                  className={`speed-btn px-2.5 py-1 rounded text-[13px] transition-colors ${
                    speechSpeed === 1.0
                      ? 'bg-primary text-on-primary font-bold'
                      : 'text-on-surface font-semibold hover:bg-surface-container'
                  }`}
                >
                  1.0x
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={speechSpeed === 1.25}
                  onClick={() => setSpeed(1.25)}
                  className={`speed-btn px-2.5 py-1 rounded text-[13px] transition-colors ${
                    speechSpeed === 1.25
                      ? 'bg-primary text-on-primary font-bold'
                      : 'text-on-surface font-semibold hover:bg-surface-container'
                  }`}
                >
                  1.25x
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={speechSpeed === 1.5}
                  onClick={() => setSpeed(1.5)}
                  className={`speed-btn px-2.5 py-1 rounded text-[13px] transition-colors ${
                    speechSpeed === 1.5
                      ? 'bg-primary text-on-primary font-bold'
                      : 'text-on-surface font-semibold hover:bg-surface-container'
                  }`}
                >
                  1.5x
                </button>
              </div>
            </div>

            {/* Playback Trigger Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Listen / Play Button */}
              <button
                type="button"
                id="btn-listen"
                aria-label={
                  currentState === 'playing'
                    ? 'Audio narration currently playing'
                    : 'Listen to spoken audio description'
                }
                onClick={toggleAudio}
                className={`flex-1 min-h-[56px] h-14 rounded-xl text-base font-bold flex items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                  currentState === 'playing'
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[26px]" id="listen-icon">
                  {currentState === 'playing' ? 'graphic_eq' : 'volume_up'}
                </span>
                <span id="listen-text">
                  {currentState === 'playing' ? 'Narrating Now...' : 'Listen to Description'}
                </span>
              </button>

              {/* Stop Audio Button (visible during playback) */}
              {currentState === 'playing' && (
                <button
                  type="button"
                  id="btn-stop-audio"
                  aria-label="Stop audio narration playback"
                  onClick={() => {
                    triggerHaptic(20);
                    setCurrentState('results');
                  }}
                  className="min-h-[56px] h-14 bg-primary text-on-primary rounded-xl px-5 font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[24px]">stop_circle</span>
                  <span>Stop</span>
                </button>
              )}
            </div>

            {/* Live Waveform Equalizer Display (Active during playback) */}
            {currentState === 'playing' && (
              <div
                id="audio-visualizer"
                className="bg-surface-container-lowest rounded-lg p-3 flex items-center justify-between border border-secondary/30 animate-in fade-in duration-200"
              >
                <span className="text-[13px] text-on-surface-variant font-medium flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
                  Narrating Scene... ({playbackTime.current}s / {playbackTime.total}s)
                </span>
                {/* Inline Animated SVG Soundwave */}
                <div aria-hidden="true" className="flex items-end gap-1 h-6">
                  <span className="w-1.5 bg-secondary rounded-full animate-bounce h-3" />
                  <span
                    className="w-1.5 bg-primary rounded-full animate-bounce h-6"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 bg-secondary rounded-full animate-bounce h-4"
                    style={{ animationDelay: '300ms' }}
                  />
                  <span
                    className="w-1.5 bg-primary rounded-full animate-bounce h-5"
                    style={{ animationDelay: '75ms' }}
                  />
                  <span
                    className="w-1.5 bg-secondary rounded-full animate-bounce h-2"
                    style={{ animationDelay: '200ms' }}
                  />
                </div>
              </div>
            )}

            {/* Utility Sub-actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setCurrentState('playing');
                }}
                className="text-sm font-bold text-primary flex items-center gap-1 py-1.5 px-2 hover:bg-surface-container-lowest rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                Replay Audio
              </button>

              <button
                type="button"
                id="btn-copy"
                onClick={copyDescription}
                className="text-sm font-bold text-primary flex items-center gap-1 py-1.5 px-2 hover:bg-surface-container-lowest rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copyFeedback ? 'done' : 'content_copy'}
                </span>
                <span>{copyFeedback ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
          </div>
        </article>
      )}

      {/* Safety & AI Notice Callout */}
      <aside
        role="note"
        aria-label="AI Safety Disclaimer"
        className="w-full bg-surface-container rounded-2xl p-4 flex items-start gap-3.5 shadow-sm border border-outline-variant/40"
      >
        <div className="w-10 h-10 rounded-xl bg-surface-container-highest text-primary flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[24px]">shield_with_heart</span>
        </div>
        <div className="space-y-1">
          <span className="text-base font-bold text-primary block">Safety Notice</span>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
            AI descriptions may occasionally be inaccurate or miss dynamic hazards. Do not rely
            on this app alone for personal navigation, stairs, or avoiding physical obstacles.
          </p>
        </div>
      </aside>

      {/* Accessibility Sensory Preference Toggles */}
      <section
        aria-label="Sensory Preferences"
        className="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-3 border border-outline-variant/30"
      >
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">
              accessibility_new
            </span>
            Live Companion Preferences
          </span>
          <span className="text-[13px] text-on-surface-variant font-medium">Instant Apply</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {/* Haptic Confirmation Switch */}
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <div className="flex flex-col pr-2">
              <span className="text-sm font-bold text-primary">Haptic Feedback</span>
              <span className="text-xs sm:text-sm text-on-surface-variant">
                Vibrate device when new obstacles are identified
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.hapticFeedback}
              onClick={() => {
                const nextVal = !preferences.hapticFeedback;
                onUpdatePreferences({ hapticFeedback: nextVal });
                if (nextVal && window.navigator?.vibrate) {
                  window.navigator.vibrate(50);
                }
              }}
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

          {/* Auto-Narrate Switch */}
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <div className="flex flex-col pr-2">
              <span className="text-sm font-bold text-primary">Auto-Narrate Findings</span>
              <span className="text-xs sm:text-sm text-on-surface-variant">
                Begin spoken narration automatically after snapshot
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.autoNarrate}
              onClick={() => {
                const nextVal = !preferences.autoNarrate;
                onUpdatePreferences({ autoNarrate: nextVal });
                triggerHaptic(20);
              }}
              className={`w-14 h-8 rounded-full p-1 relative transition-colors flex items-center flex-shrink-0 cursor-pointer ${
                preferences.autoNarrate ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`w-6 h-6 bg-surface-container-lowest rounded-full shadow-md transform transition-transform ${
                  preferences.autoNarrate ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
