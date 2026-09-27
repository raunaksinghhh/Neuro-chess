import React from 'react';
import { Target, Flame, Lightbulb, SkipForward, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

export function PuzzleMode({
  currentPuzzle,
  puzzleRating,
  streak,
  onNextPuzzle,
  onRetryPuzzle,
  onShowHint,
  hintVisible,
  puzzleStatus // 'playing', 'solved', 'failed'
}) {
  return (
    <div className="mode-panel glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Puzzle Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <Target size={16} />
          <span>Tactical Puzzle Arena</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-good" title="Current Streak">
            <Flame size={12} /> {streak} Streak
          </span>
          <span className="badge badge-good">Rating {puzzleRating}</span>
        </div>
      </div>

      {/* Active Puzzle Info Card */}
      {currentPuzzle && (
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentPuzzle.title}
            </span>
            <span className="badge badge-good">{currentPuzzle.theme}</span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
            {currentPuzzle.playerColor === 'w' ? 'White to move and win' : 'Black to move and win'}
          </div>

          {currentPuzzle.description && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {currentPuzzle.description}
            </div>
          )}

          {hintVisible && currentPuzzle.hint && (
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', background: 'rgba(0, 0, 0, 0.05)', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lightbulb size={13} /> Hint: {currentPuzzle.hint}
            </div>
          )}
        </div>
      )}

      {/* Status Feedback */}
      {puzzleStatus === 'solved' && (
        <div className="badge badge-good" style={{ padding: '8px', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
          <CheckCircle2 size={15} /> Puzzle Solved! +15 Rating
        </div>
      )}
      {puzzleStatus === 'failed' && (
        <div className="badge badge-good" style={{ padding: '8px', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
          <XCircle size={15} /> Incorrect Move. Try again!
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button className="btn-secondary" onClick={onShowHint}>
          <Lightbulb size={15} /> Hint
        </button>
        <button className="btn-secondary" onClick={onRetryPuzzle}>
          <RotateCcw size={15} /> Retry
        </button>
      </div>

      <button className="btn-primary" onClick={onNextPuzzle} style={{ width: '100%' }}>
        <SkipForward size={16} /> Next Puzzle
      </button>
    </div>
  );
}
