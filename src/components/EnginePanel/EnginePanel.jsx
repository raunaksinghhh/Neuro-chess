import React from 'react';
import { Activity } from 'lucide-react';
import { NeuralVisualizer } from './NeuralVisualizer';
import './EnginePanel.css';

export function EnginePanel({
  engineAnalysis,
  activePersona,
  isThinking = false,
  activeMode = 'play',
  showHeatmap,
  onToggleHeatmap,
  showThreats,
  onToggleThreats,
  showEngineArrow,
  onToggleEngineArrow,
  onSelectCandidateMove
}) {
  const depth = engineAnalysis?.depth || 0;
  const nodes = engineAnalysis?.nodes ? (engineAnalysis.nodes > 1000 ? `${(engineAnalysis.nodes / 1000).toFixed(1)}k` : engineAnalysis.nodes) : 0;
  const nps = engineAnalysis?.nps ? (engineAnalysis.nps > 1000 ? `${(engineAnalysis.nps / 1000).toFixed(1)}k` : engineAnalysis.nps) : 0;

  const showCandidateLines = activeMode === 'analysis' || activeMode === 'engine_vs_engine';

  return (
    <div className="engine-panel">
      {/* Header / Active AI Persona */}
      <div className="engine-header">
        <div className="engine-identity">
          <div className="engine-avatar">{activePersona?.avatar || '🧠'}</div>
          <div className="engine-meta">
            <div className="engine-name">{activePersona?.name || 'NeuroEngine'}</div>
            <div className="engine-elo">
              {activePersona?.elo ? `Elo ${activePersona.elo}` : 'Neural Net'} • {activePersona?.title || 'Engine'}
            </div>
          </div>
        </div>
        {isThinking && (
          <span className="badge badge-cyan animate-pulse-glow">
            <Activity size={12} className="animate-spin" /> Thinking
          </span>
        )}
      </div>

      {/* Engine Metrics */}
      <div className="engine-metrics">
        <div className="metric-item">
          <span className="metric-label">Depth</span>
          <span className="metric-value">{depth} plies</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Nodes</span>
          <span className="metric-value">{nodes}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Speed</span>
          <span className="metric-value">{nps} /s</span>
        </div>
      </div>

      {/* Candidate PV Lines (Only in Analysis Mode) */}
      {showCandidateLines && engineAnalysis?.lines && engineAnalysis.lines.length > 0 && (
        <div className="engine-lines">
          <div className="lines-header">Top Candidate Lines (Multi-PV)</div>
          {engineAnalysis.lines.map((line, idx) => {
            const formattedScore = (line.score / 100).toFixed(1);
            const scoreDisplay = line.score > 0 ? `+${formattedScore}` : formattedScore;

            return (
              <div
                key={idx}
                className="pv-line-card"
                onClick={() => onSelectCandidateMove && onSelectCandidateMove(line.move)}
                style={{ cursor: onSelectCandidateMove ? 'pointer' : 'default' }}
              >
                <div className="pv-move-badge">
                  <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                  <span>{line.san}</span>
                </div>
                <div className="pv-eval-score">{scoreDisplay}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Neural Overlays Toggle Bar (Only in Analysis or if enabled) */}
      {activeMode === 'analysis' && (
        <NeuralVisualizer
          showHeatmap={showHeatmap}
          onToggleHeatmap={onToggleHeatmap}
          showThreats={showThreats}
          onToggleThreats={onToggleThreats}
          showEngineArrow={showEngineArrow}
          onToggleEngineArrow={onToggleEngineArrow}
        />
      )}
    </div>
  );
}
