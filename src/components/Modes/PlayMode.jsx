import React from 'react';
import {
  Play,
  RotateCcw,
  Flag,
  Lightbulb,
  Handshake,
  Clock,
  User,
  Bot
} from 'lucide-react';
import { AI_PERSONAS } from '../../engine/personas';

export function PlayMode({
  gameState,
  onStartGame,
  onTakeback,
  onResign,
  onOfferDraw,
  onGetHint,
  onSelectPersona,
  activePersona,
  playerColor,
  onSetPlayerColor,
  timeControl,
  onSetTimeControl,
  whiteTime,
  blackTime,
  isGameActive
}) {
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return '∞';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const timeOptions = [
    { id: '1m', label: '1m Bullet', initial: 60, inc: 0 },
    { id: '3+2', label: '3+2 Blitz', initial: 180, inc: 2 },
    { id: '10m', label: '10m Rapid', initial: 600, inc: 0 },
    { id: 'unlimited', label: 'Unlimited', initial: null, inc: 0 }
  ];

  return (
    <div className="mode-panel glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Timers Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* White Clock */}
        <div
          className={`glass-panel ${gameState?.turn === 'w' && isGameActive ? 'glass-panel-glow' : ''}`}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', border: '1px solid #94a3b8' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{playerColor === 'w' ? 'You' : activePersona?.name}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: (whiteTime && whiteTime <= 15 && isGameActive) ? '#ef4444' : '#ffffff' }}>
            {formatTime(whiteTime)}
          </span>
        </div>

        {/* Black Clock */}
        <div
          className={`glass-panel ${gameState?.turn === 'b' && isGameActive ? 'glass-panel-glow' : ''}`}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1e2230', border: '1px solid #475569' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{playerColor === 'b' ? 'You' : activePersona?.name}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: (blackTime && blackTime <= 15 && isGameActive) ? '#ef4444' : '#ffffff' }}>
            {formatTime(blackTime)}
          </span>
        </div>
      </div>

      {!isGameActive ? (
        /* Setup Match Form */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Select Opponent Persona
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {AI_PERSONAS.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectPersona(p)}
                className={`glass-panel ${activePersona?.id === p.id ? 'glass-panel-glow' : ''}`}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: activePersona?.id === p.id ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{p.avatar}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.description}</div>
                  </div>
                </div>
                <span className="badge badge-cyan">Elo {p.elo}</span>
              </div>
            ))}
          </div>

          {/* Color & Time Control Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Color Select */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>PLAY AS</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn-secondary ${playerColor === 'w' ? 'active' : ''}`}
                  onClick={() => onSetPlayerColor('w')}
                  style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                >
                  ⚪ White
                </button>
                <button
                  className={`btn-secondary ${playerColor === 'b' ? 'active' : ''}`}
                  onClick={() => onSetPlayerColor('b')}
                  style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                >
                  ⚫ Black
                </button>
              </div>
            </div>

            {/* Time Control */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>TIME CONTROL</div>
              <select
                value={timeControl?.id || '10m'}
                onChange={(e) => {
                  const opt = timeOptions.find((t) => t.id === e.target.value);
                  if (opt) onSetTimeControl(opt);
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {timeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn-primary" onClick={onStartGame} style={{ width: '100%', marginTop: '6px' }}>
            <Play size={16} /> Start Game vs AI
          </button>
        </div>
      ) : (
        /* In-Game Action Bar */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <button className="btn-secondary" onClick={onGetHint} title="Engine Hint">
              <Lightbulb size={16} color="var(--neon-amber)" />
              <span style={{ fontSize: '12px' }}>Hint</span>
            </button>
            <button className="btn-secondary" onClick={onTakeback} title="Takeback Move">
              <RotateCcw size={16} />
              <span style={{ fontSize: '12px' }}>Undo</span>
            </button>
            <button className="btn-secondary" onClick={onOfferDraw} title="Offer Draw">
              <Handshake size={16} />
              <span style={{ fontSize: '12px' }}>Draw</span>
            </button>
            <button className="btn-danger" onClick={onResign} title="Resign Game">
              <Flag size={16} />
              <span style={{ fontSize: '12px' }}>Resign</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
