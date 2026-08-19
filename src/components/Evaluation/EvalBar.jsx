import React from 'react';
import './EvalBar.css';

export function EvalBar({ score = 0, orientation = 'white', isMate = false, mateIn = 0 }) {
  // Convert score (centipawns) to white percentage (0% to 100%)
  // Score of 0 -> 50%
  // +500 cp (+5 pawns) -> ~90%
  // -500 cp (-5 pawns) -> ~10%
  let whitePercentage = 50;

  if (isMate) {
    whitePercentage = mateIn > 0 ? 100 : 0;
  } else {
    const clampedScore = Math.max(-1000, Math.min(1000, score));
    // Logistic curve for realistic smooth bar representation
    whitePercentage = 50 + 50 * (2 / (1 + Math.exp(-0.0035 * clampedScore)) - 1);
    whitePercentage = Math.max(4, Math.min(96, whitePercentage));
  }

  // Format display score
  let scoreText = '0.0';
  if (isMate) {
    scoreText = `M${Math.abs(mateIn)}`;
  } else {
    const pawns = (Math.abs(score) / 100).toFixed(1);
    scoreText = score > 0 ? `+${pawns}` : score < 0 ? `-${pawns}` : '0.0';
  }

  const isWhiteAdvantage = score >= 0;
  const isFlipped = orientation === 'black';

  return (
    <div className={`eval-bar-container ${isFlipped ? 'eval-bar-flipped' : ''}`} title={`Evaluation: ${scoreText}`}>
      <div className="eval-bar-track">
        <div
          className="eval-white-fill"
          style={{ height: `${whitePercentage}%` }}
        />
        
        {/* Score Display Tag */}
        <div
          className={`eval-score-tag ${
            (isWhiteAdvantage && !isFlipped) || (!isWhiteAdvantage && isFlipped)
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
