import React, { useState } from 'react';
import { HistoryScan, SensoryPreferences } from '../types';

interface HistoryViewProps {
  scans: HistoryScan[];
  preferences: SensoryPreferences;
  onClearHistory: () => void;
  onLoadScanIntoLive?: (scan: HistoryScan) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  scans,
  preferences,
  onClearHistory,
  onLoadScanIntoLive,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedScan, setSelectedScan] = useState<HistoryScan | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredScans = scans.filter((scan) => {
    const query = searchTerm.toLowerCase();
    return (
      scan.locationLabel.toLowerCase().includes(query) ||
      scan.analysis.immediateWalkingPath.toLowerCase().includes(query) ||
      scan.analysis.obstacleAssessment.toLowerCase().includes(query) ||
      scan.analysis.objectsInReach.toLowerCase().includes(query)
    );
  });

  const speakScan = (scan: HistoryScan) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const text = `${scan.locationLabel}. ${scan.analysis.overallSummary}. Immediate path: ${scan.analysis.immediateWalkingPath}. Obstacle assessment: ${scan.analysis.obstacleAssessment}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = preferences.speechRate;
    window.speechSynthesis.speak(utterance);

    if (preferences.hapticFeedback && window.navigator?.vibrate) {
      window.navigator.vibrate(30);
    }
  };

  const copyTranscript = (scan: HistoryScan) => {
    const text = `Scan (${scan.locationLabel} - ${scan.displayTime}):\n1. Path: ${scan.analysis.immediateWalkingPath}\n2. Objects: ${scan.analysis.objectsInReach}\n3. Lighting: ${scan.analysis.lightAndOrientation}\n4. Obstacles: ${scan.analysis.obstacleAssessment}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(scan.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-5 animate-in fade-in duration-200">
      {/* Title */}
      <section className="flex flex-col space-y-1">
        <h1 className="text-2xl sm:text-3xl text-primary tracking-tight font-extrabold leading-tight">
          Visual Scan Archives
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant font-medium leading-relaxed">
          Review previous scene descriptions, tactile walkthroughs, and audio logs.
        </p>
      </section>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-on-surface-variant text-[22px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved paths, objects, rooms…"
            className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm font-medium text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        {scans.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="h-12 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-error rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-colors self-end sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            Clear Log
          </button>
        )}
      </div>

      {/* Scans List */}
      {filteredScans.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-10 text-center space-y-3 border border-outline-variant/30 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">manage_search</span>
          </div>
          <h3 className="text-lg font-bold text-primary">No visual scans found</h3>
          <p className="text-sm text-on-surface-variant max-w-xs">
            {searchTerm
              ? 'Try searching with a different room name or obstacle keyword.'
              : 'Take photos in Live Mode to automatically preserve your spatial path logs.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan) => (
            <div
              key={scan.id}
              className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-4 shadow-sm border border-outline-variant/30 hover:border-secondary/40 transition-all flex flex-col sm:flex-row gap-3.5"
            >
              {/* Thumbnail */}
              <div className="relative w-full sm:w-32 h-36 sm:h-28 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                <img
                  src={scan.imageUrl}
                  alt={scan.locationLabel}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-primary/90 text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {scan.analysis.clarityScore}% clarity
                </span>
              </div>

              {/* Content info */}
              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-primary">
                      {scan.locationLabel}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {scan.displayTime}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface font-medium line-clamp-2 mt-1">
                    {scan.analysis.immediateWalkingPath}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-secondary">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>{scan.analysis.obstacleAssessment}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/60">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Listen to audio recording of this scan"
                      onClick={() => speakScan(scan)}
                      className="h-9 px-3 rounded-lg bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">volume_up</span>
                      Listen
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedScan(scan)}
                      className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">expand</span>
                      Details
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyTranscript(scan)}
                    className="h-9 px-2.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedId === scan.id ? 'done' : 'content_copy'}
                    </span>
                    <span>{copiedId === scan.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Inspection Modal */}
      {selectedScan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="bg-surface-container-lowest text-on-surface rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-primary/20">
            <div className="flex items-center justify-between border-b pb-3 border-surface-container-high">
              <div>
                <h3 className="font-bold text-lg text-primary">{selectedScan.locationLabel}</h3>
                <span className="text-xs text-on-surface-variant">{selectedScan.displayTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-surface-container">
              <img
                src={selectedScan.imageUrl}
                alt={selectedScan.locationLabel}
                className="w-full h-full object-cover"
              />
            </div>

            <ol className="space-y-2.5 text-sm">
              <li className="bg-surface-container-low p-3 rounded-xl">
                <span className="font-bold text-primary block">1. Immediate Walking Path</span>
                <p>{selectedScan.analysis.immediateWalkingPath}</p>
              </li>
              <li className="bg-surface-container-low p-3 rounded-xl">
                <span className="font-bold text-primary block">2. Objects in Reach</span>
                <p>{selectedScan.analysis.objectsInReach}</p>
              </li>
              <li className="bg-surface-container-low p-3 rounded-xl">
                <span className="font-bold text-primary block">3. Light & Orientation</span>
                <p>{selectedScan.analysis.lightAndOrientation}</p>
              </li>
              <li className="bg-surface-container-low p-3 rounded-xl border border-secondary/30">
                <span className="font-bold text-secondary block">4. Obstacle Assessment</span>
                <p className="font-semibold">{selectedScan.analysis.obstacleAssessment}</p>
              </li>
            </ol>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => speakScan(selectedScan)}
                className="flex-1 h-12 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
                Listen to Narration
              </button>
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="px-5 h-12 bg-surface-container hover:bg-surface-container-high rounded-xl font-bold text-sm text-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
