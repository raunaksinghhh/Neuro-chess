import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, BarChart2, X } from 'lucide-react';

export function GameOverModal({
  isOpen,
  onClose,
  result, // '1-0', '0-1', '1/2-1/2'
  reason, // 'Checkmate', 'Resignation', 'Timeout', 'Stalemate', 'Draw Agreed'
  playerColor,
  onRematch,
  onOpenReview
}) {
  const isWin =
    (result === '1-0' && playerColor === 'w') ||
    (result === '0-1' && playerColor === 'b');
  const isLoss =
    (result === '1-0' && playerColor === 'b') ||
    (result === '0-1' && playerColor === 'w');
  const isDraw = result === '1/2-1/2';

  useEffect(() => {
    if (isOpen && isWin) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen, isWin]);

  if (!isOpen) return null;

  let title = 'Game Over';
  let badgeColor = 'badge-purple';
  if (isWin) {
    title = 'Victory!';
    badgeColor = 'badge-emerald';
  } else if (isLoss) {
    title = 'Defeat';
    badgeColor = 'badge-rose';
  } else if (isDraw) {
    title = 'Draw';
    badgeColor = 'badge-amber';
  }

  return (
    <div className="promotion-backdrop" onClick={onClose}>
      <div
        className="glass-panel-glow"
        style={{
          width: '90%',
          maxWidth: '420px',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn-icon"
          style={{ position: 'absolute', top: '14px', right: '14px' }}
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <div style={{ fontSize: '42px', marginTop: '6px' }}>
          {isWin ? '🏆' : isLoss ? '⚔️' : '🤝'}
        </div>

        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {title}
          </h2>
          <span className={`badge ${badgeColor}`} style={{ fontSize: '12px', padding: '4px 12px' }}>
            {reason} • Result: {result}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' }}>
          <button className="btn-primary" onClick={onRematch} style={{ width: '100%' }}>
            <RefreshCw size={16} /> New Game / Rematch
          </button>
          <button className="btn-secondary" onClick={onOpenReview} style={{ width: '100%' }}>
            <BarChart2 size={16} color="var(--neon-purple)" /> Review Game & Accuracy
          </button>
        </div>
      </div>
    </div>
  );
}
