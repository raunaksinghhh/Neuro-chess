import React from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { AI_PERSONAS } from '../../engine/personas';

export function EngineVsEngineMode({
  whitePersona,
  blackPersona,
  onSetWhitePersona,
  onSetBlackPersona,
  isRunning,
  onToggleRunning,
  onReset,
  speedMs,
  onSetSpeedMs
}) {
  return (
    <div className="mode-panel glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FastForward size={16} color="var(--neon-purple)" />
        <span>Self-Play Simulation (AI vs AI)</span>
      </div>

      {/* Engine Selection Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* White Engine */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
            ⚪ WHITE ENGINE
          </div>
          <select
            value={whitePersona?.id || 'tal'}
            onChange={(e) => {
              const p = AI_PERSONAS.find((item) => item.id === e.target.value);
              if (p) onSetWhitePersona(p);
            }}
            disabled={isRunning}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {AI_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.elo})</option>
            ))}
          </select>
        </div>

        {/* Black Engine */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
            ⚫ BLACK ENGINE
          </div>
          <select
            value={blackPersona?.id || 'magnus'}
            onChange={(e) => {
              const p = AI_PERSONAS.find((item) => item.id === e.target.value);
              if (p) onSetBlackPersona(p);
            }}
            disabled={isRunning}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {AI_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.elo})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Speed Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>MOVE DELAY</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>{(speedMs / 1000).toFixed(1)}s</span>
        </div>
        <input
          type="range"
          min="200"
          max="3000"
          step="100"
          value={speedMs}
          onChange={(e) => onSetSpeedMs(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--neon-cyan)' }}
        />
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className={isRunning ? 'btn-danger' : 'btn-neural'}
          onClick={onToggleRunning}
          style={{ flex: 1 }}
        >
          {isRunning ? <><Pause size={16} /> Pause Match</> : <><Play size={16} /> Start Simulation</>}
        </button>
        <button className="btn-secondary" onClick={onReset} title="Reset Position">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
