import React from 'react';
import { BarChart3, Award, Sparkles } from 'lucide-react';
import './GameReview.css';

export function GameReview({ history = [], onSelectMove, currentMoveIndex = -1 }) {
  // Aggregate move classifications
  const stats = {
    w: { brilliant: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, total: 0, accuracySum: 0 },
    b: { brilliant: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, total: 0, accuracySum: 0 }
  };

  const evalPoints = [];

  history.forEach((m, idx) => {
    const isWhite = idx % 2 === 0;
    const side = isWhite ? stats.w : stats.b;
    side.total++;

    const classType = m.classification?.type || 'good';
    if (side[classType] !== undefined) {
      side[classType]++;
    }

    // Weight accuracy
    const weights = { brilliant: 100, best: 100, good: 90, inaccuracy: 70, mistake: 45, blunder: 10 };
    side.accuracySum += weights[classType] || 85;

    // Track eval
    const score = m.evalAfter !== undefined ? m.evalAfter : 0;
    evalPoints.push({ moveIdx: idx, score, isWhite, san: m.san });
  });

  const whiteAccuracy = stats.w.total > 0 ? (stats.w.accuracySum / stats.w.total).toFixed(1) : '100.0';
  const blackAccuracy = stats.b.total > 0 ? (stats.b.accuracySum / stats.b.total).toFixed(1) : '100.0';

  // SVG Chart path calculation
  const chartWidth = 300;
  const chartHeight = 100;
  const midY = chartHeight / 2;

  let pathD = `M 0 ${midY} `;
  const coords = [];

  if (evalPoints.length > 0) {
    const stepX = chartWidth / Math.max(1, evalPoints.length - 1);
    evalPoints.forEach((pt, i) => {
      const x = i * stepX;
      // Clamp score from -800 to +800 cp
      const clampedScore = Math.max(-800, Math.min(800, pt.score));
      const y = midY - (clampedScore / 800) * (midY - 8);
      coords.push({ x, y, ...pt });
      pathD += `L ${x} ${y} `;
    });
  }

  const classificationRows = [
    { label: 'Brilliant', symbol: '!!', color: '#00f0ff', key: 'brilliant' },
    { label: 'Best', symbol: '⭐', color: '#10b981', key: 'best' },
    { label: 'Good', symbol: '✓', color: '#94a3b8', key: 'good' },
    { label: 'Inaccuracy', symbol: '?!', color: '#f59e0b', key: 'inaccuracy' },
    { label: 'Mistake', symbol: '?', color: '#f97316', key: 'mistake' },
    { label: 'Blunder', symbol: '??', color: '#ef4444', key: 'blunder' },
  ];

  return (
    <div className="gamereview-container">
      <div className="review-header">
        <div className="review-title">
          <Award size={18} color="var(--neon-purple)" />
          <span>Game Analytics & Accuracy</span>
        </div>
        <span className="badge badge-purple">
          <Sparkles size={11} /> AI Reviewed
        </span>
      </div>

      {/* Accuracy Banner */}
      <div className="accuracy-banner">
        <div className="accuracy-card">
          <span className="accuracy-label">⚪ White Accuracy</span>
          <span className="accuracy-percentage">{whiteAccuracy}%</span>
        </div>
        <div className="accuracy-card">
          <span className="accuracy-label">⚫ Black Accuracy</span>
          <span className="accuracy-percentage">{blackAccuracy}%</span>
        </div>
      </div>

      {/* Evaluation Advantage Chart */}
      <div className="eval-chart-wrapper">
        <svg className="eval-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          {/* Zero baseline */}
          <line x1="0" y1={midY} x2={chartWidth} y2={midY} stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3,3" strokeWidth="1" />

          {/* Eval Curve */}
          {coords.length > 0 && (
            <path d={pathD} fill="none" stroke="var(--neon-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Move Points */}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={currentMoveIndex === c.moveIdx ? 4 : 2}
              fill={currentMoveIndex === c.moveIdx ? '#ffffff' : (c.score >= 0 ? '#00f0ff' : '#a855f7')}
              stroke="#0f172a"
              strokeWidth="1"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectMove(c.moveIdx)}
            />
          ))}
        </svg>
      </div>

      {/* Move Quality Breakdown */}
      <div className="classification-table">
        {classificationRows.map((row) => (
          <div key={row.key} className="classification-row">
            <span className="class-white-count">{stats.w[row.key]}</span>
            <span className="class-label" style={{ color: row.color }}>
              <span>{row.symbol}</span>
              <span>{row.label}</span>
            </span>
            <span className="class-black-count">{stats.b[row.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
