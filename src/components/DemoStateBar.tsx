import React from 'react';
import { DemoState } from '../types';

interface DemoStateBarProps {
  currentState: DemoState;
  onSelectState: (state: DemoState) => void;
}

export const DemoStateBar: React.FC<DemoStateBarProps> = ({
  currentState,
  onSelectState,
}) => {
  const stateLabels: Record<DemoState, { badge: string; badgeClass: string }> = {
    results: {
      badge: 'Results Ready',
      badgeClass: 'bg-secondary-container text-on-secondary-container',
    },
    empty: {
      badge: 'Empty State',
      badgeClass: 'bg-surface-container-highest text-on-surface',
    },
    analyzing: {
      badge: 'Analyzing Scene',
      badgeClass: 'bg-secondary text-on-secondary',
    },
    playing: {
      badge: 'Audio Playing',
      badgeClass: 'bg-primary text-on-primary',
    },
    error: {
      badge: 'Error State',
      badgeClass: 'bg-error-container text-on-error-container',
    },
  };

  const currentMeta = stateLabels[currentState];

  return (
    <div
      role="toolbar"
      aria-label="Screen State Demonstrator"
      className="w-full bg-surface-container rounded-xl p-2.5 shadow-sm border border-outline-variant/30"
    >
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-sm font-semibold text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-secondary">
            tune
          </span>
          Interactive Demo State:
        </span>
        <span
          className={`text-[12px] px-2.5 py-0.5 rounded-full font-bold transition-colors ${currentMeta.badgeClass}`}
        >
          {currentMeta.badge}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5" role="group">
        <button
          type="button"
          onClick={() => onSelectState('results')}
          className={`h-10 px-2 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1 ${
            currentState === 'results'
              ? 'bg-primary text-on-primary shadow-sm font-bold ring-1 ring-primary'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          Results (Default)
        </button>

        <button
          type="button"
          onClick={() => onSelectState('empty')}
          className={`h-10 px-2 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1 ${
            currentState === 'empty'
              ? 'bg-primary text-on-primary shadow-sm font-bold ring-1 ring-primary'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
          Initial / Empty
        </button>

        <button
          type="button"
          onClick={() => onSelectState('analyzing')}
          className={`h-10 px-2 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1 ${
            currentState === 'analyzing'
              ? 'bg-primary text-on-primary shadow-sm font-bold ring-1 ring-primary'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
          Analyzing
        </button>

        <button
          type="button"
          onClick={() => onSelectState('playing')}
          className={`h-10 px-2 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1 ${
            currentState === 'playing'
              ? 'bg-primary text-on-primary shadow-sm font-bold ring-1 ring-primary'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">volume_up</span>
          Audio Playing
        </button>

        <button
          type="button"
          onClick={() => onSelectState('error')}
          className={`h-10 px-2 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1 col-span-2 sm:col-span-1 ${
            currentState === 'error'
              ? 'bg-primary text-on-primary shadow-sm font-bold ring-1 ring-primary'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">error</span>
          Error State
        </button>
      </div>
    </div>
  );
};
