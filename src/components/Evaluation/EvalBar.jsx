import React from 'react';
import './EvalBar.css';

export function EvalBar({ score = 0, orientation = 'white', isMate = false, mateIn = 0 }) {
  let whitePercent = 50;

  if (isMate) {
    whitePercent = mateIn > 0 ? 97 : 3;
  } else {
    const clamped = Math.max(-1000, Math.min(1000, score));
    whitePercent = 50 + 50 * (2 / (1 + Math.exp(-0.0038 * clamped)) - 1);
    whitePercent = Math.max(4, Math.min(96, whitePercent));
  }

  const blackPercent = 100 - whitePercent;

  let scoreText = '0.0';
  if (isMate) {
    scoreText = `M${Math.abs(mateIn)}`;
  } else {
    const pawns = (Math.abs(score) / 100).toFixed(1);
    scoreText = score > 0 ? `+${pawns}` : score < 0 ? `-${pawns}` : '0.0';
  }

  const isWhiteAhead = score >= 0;
  const isFlipped = orientation === 'black';

  return (
    <div
      className={`eval-bar-container ${isFlipped ? 'eval-bar-flipped' : ''}`}
      title={`Evaluation: ${scoreText}`}
    >
      <div className="eval-bar-track">
        {/* Black fill (top) */}
        <div className="eval-black-fill" style={{ height: `${blackPercent}%` }} />
        {/* White fill (bottom) */}
        <div className="eval-white-fill" style={{ height: `${whitePercent}%` }} />

        {/* Score label */}
        <div
          className={`eval-score-tag ${
            (isWhiteAhead && !isFlipped) || (!isWhiteAhead && isFlipped)
              ? 'eval-score-white'
              : 'eval-score-black'
          }`}
        >
          {scoreText}
        </div>
      </div>
    </div>
  );
}
