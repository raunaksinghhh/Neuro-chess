import React from 'react';
import {
  Sparkles,
  RotateCcw,
  Upload,
  Layers,
  Trash2,
  Cpu
} from 'lucide-react';

export function AnalysisMode({
  onResetBoard,
  onClearBoard,
  onOpenFENModal,
  isContinuousEval,
  onToggleContinuousEval,
  onAnalyzeDeep
}) {
  return (
    <div className="mode-panel glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Layers size={16} color="var(--neon-cyan)" />
        <span>Analysis Studio & Sandbox</span>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
        Freely play moves for both sides, explore tactical branches, inspect neural attention maps, or import custom FEN & PGNs.
      </p>

      {/* Primary Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button className="btn-secondary" onClick={onOpenFENModal}>
          <Upload size={15} /> Load FEN / PGN
        </button>
        <button className="btn-secondary" onClick={onResetBoard}>
          <RotateCcw size={15} /> Reset Position
        </button>
      </div>

      {/* Deep Analysis & Continuous Engine Evaluation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <Cpu size={14} color="var(--neon-cyan)" />
            <span>Continuous AI Evaluation</span>
          </div>
          <button
            className={`badge ${isContinuousEval ? 'badge-cyan' : 'badge-good'}`}
            onClick={onToggleContinuousEval}
          >
            {isContinuousEval ? 'Active' : 'Paused'}
          </button>
        </div>

        <button className="btn-primary" onClick={onAnalyzeDeep} style={{ width: '100%', marginTop: '4px' }}>
          <Sparkles size={16} /> Deep Neural Scan (Depth 5)
        </button>
      </div>
    </div>
  );
}
