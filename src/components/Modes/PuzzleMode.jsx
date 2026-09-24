import React from 'react';
import { Target, Flame, Lightbulb, SkipForward, RotateCcw } from 'lucide-react';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700 }}>
          <Target size={16} color="var(--neon-emerald)" />
          <span>Tactical Puzzle Arena</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-amber" title="Current Streak">
            <Flame size={12} /> {streak} Streak
          </span>
          <span className="badge badge-emerald">Rating {puzzleRating}</span>
        </div>
      </div>

      {/* Active Puzzle Info Card */}
      {currentPuzzle && (
        <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentPuzzle.title}
            </span>
            <span className="badge badge-purple">{currentPuzzle.theme}</span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--neon-cyan)', fontWeight: 600 }}>
            {currentPuzzle.playerColor === 'w' ? '⚪ White to move and win' : '⚫ Black to move and win'}
          </div>

          {currentPuzzle.description && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentPuzzle.description}
            </div>
          )}

          {hintVisible && currentPuzzle.hint && (
            <div style={{ fontSize: '12px', color: 'var(--neon-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 10px', borderRadius: '4px' }}>
              💡 Hint: {currentPuzzle.hint}
            </div>
          )}
        </div>
      )}

      {/* Status Feedback */}
      {puzzleStatus === 'solved' && (
        <div className="badge badge-emerald" style={{ padding: '8px', justifyContent: 'center', fontSize: '13px' }}>
          🎉 Puzzle Solved! +15 Rating
        </div>
      )}
      {puzzleStatus === 'failed' && (
        <div className="badge badge-rose" style={{ padding: '8px', justifyContent: 'center', fontSize: '13px' }}>
          ❌ Incorrect Move. Try again!
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button className="btn-secondary" onClick={onShowHint}>
          <Lightbulb size={15} color="var(--neon-amber)" /> Hint
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
