import React from 'react';
import { Eye, ShieldAlert, Cpu } from 'lucide-react';

export function NeuralVisualizer({
  showHeatmap,
  onToggleHeatmap,
  showThreats,
  onToggleThreats,
  showEngineArrow,
  onToggleEngineArrow
}) {
  return (
    <div className="neural-controls">
      <div className="lines-header">Neural Attention Overlays</div>

      {/* Heatmap Toggle */}
      <div className="neural-toggle-row">
        <div className="toggle-label">
          <Eye size={14} color="var(--neon-cyan)" />
          <span>Influence Heatmap</span>
        </div>
        <button
          className={`badge ${showHeatmap ? 'badge-cyan' : 'badge-good'}`}
          onClick={onToggleHeatmap}
        >
          {showHeatmap ? 'Active' : 'Off'}
        </button>
      </div>

      {/* Threat Arrows Toggle */}
      <div className="neural-toggle-row">
        <div className="toggle-label">
          <ShieldAlert size={14} color="var(--neon-rose)" />
          <span>Threat Vectors</span>
        </div>
        <button
          className={`badge ${showThreats ? 'badge-rose' : 'badge-good'}`}
          onClick={onToggleThreats}
        >
          {showThreats ? 'Active' : 'Off'}
        </button>
      </div>

      {/* Engine Best Move Arrow Toggle */}
      <div className="neural-toggle-row">
        <div className="toggle-label">
          <Cpu size={14} color="var(--neon-purple)" />
          <span>Engine Best Arrow</span>
        </div>
        <button
          className={`badge ${showEngineArrow ? 'badge-purple' : 'badge-good'}`}
          onClick={onToggleEngineArrow}
        >
          {showEngineArrow ? 'Active' : 'Off'}
        </button>
      </div>
    </div>
  );
}
