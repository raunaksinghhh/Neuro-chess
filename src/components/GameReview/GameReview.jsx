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
    { label: 'Brilliant Moves', key: 'brilliant' },
    { label: 'Best Moves', key: 'best' },
    { label: 'Good Moves', key: 'good' },
    { label: 'Inaccuracies', key: 'inaccuracy' },
    { label: 'Mistakes', key: 'mistake' },
    { label: 'Blunders', key: 'blunder' },
  ];

  return (
    <div className="gamereview-container">
      <div className="review-header">
        <div className="review-title">
          <Award size={18} />
          <span>Game Analytics & Accuracy</span>
        </div>
        <span className="badge badge-good">
          <Sparkles size={11} /> AI Reviewed
        </span>
      </div>

      {/* Accuracy Banner */}
      <div className="accuracy-banner">
        <div className="accuracy-card">
          <span className="accuracy-label">
            <span className="side-dot white-dot" /> White Accuracy
          </span>
          <span className="accuracy-percentage">{whiteAccuracy}%</span>
        </div>
        <div className="accuracy-card">
          <span className="accuracy-label">
            <span className="side-dot black-dot" /> Black Accuracy
          </span>
          <span className="accuracy-percentage">{blackAccuracy}%</span>
        </div>
      </div>

      {/* Evaluation Advantage Chart */}
      <div className="eval-chart-wrapper">
        {coords.length === 0 ? (
          <div className="eval-chart-empty">
            <BarChart3 size={18} />
            <span>No moves recorded yet — play moves to view evaluation curve</span>
          </div>
        ) : (
          <svg className="eval-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Zero baseline */}
            <line x1="0" y1={midY} x2={chartWidth} y2={midY} stroke="rgba(0, 0, 0, 0.15)" strokeDasharray="3,3" strokeWidth="1" />

            {/* Eval Curve */}
            <path d={pathD} fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Move Points */}
            {coords.map((c, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={currentMoveIndex === c.moveIdx ? 4 : 2.5}
                fill={currentMoveIndex === c.moveIdx ? '#0f172a' : '#64748b'}
                stroke="#ffffff"
                strokeWidth="1"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectMove(c.moveIdx)}
              />
            ))}
          </svg>
        )}
      </div>

      {/* Move Quality Analytics Table */}
      <div className="analytics-table-card">
        <div className="analytics-table-header">
          <div className="analytics-th-white">
            <span className="side-dot white-dot" />
            <span>White</span>
          </div>
          <div className="analytics-th-title">Move Quality Breakdown</div>
          <div className="analytics-th-black">
            <span>Black</span>
            <span className="side-dot black-dot" />
          </div>
        </div>

        <div className="analytics-table-body">
          {classificationRows.map((row) => {
            const wCount = stats.w[row.key] || 0;
            const bCount = stats.b[row.key] || 0;
            const total = wCount + bCount;
            const wPercent = total > 0 ? (wCount / total) * 100 : 50;
            const bPercent = total > 0 ? (bCount / total) * 100 : 50;

            return (
              <div key={row.key} className="analytics-row">
                <span className="analytics-count-white">{wCount}</span>

                <div className="analytics-label-col">
                  <span className="analytics-label-text">{row.label}</span>
                  <div className="analytics-bar-track" title={`White: ${wCount} | Black: ${bCount}`}>
                    {total > 0 ? (
                      <>
                        <div className="analytics-bar-white" style={{ width: `${wPercent}%` }} />
                        <div className="analytics-bar-black" style={{ width: `${bPercent}%` }} />
                      </>
                    ) : (
                      <div className="analytics-bar-empty" />
                    )}
                  </div>
                </div>

                <span className="analytics-count-black">{bCount}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
