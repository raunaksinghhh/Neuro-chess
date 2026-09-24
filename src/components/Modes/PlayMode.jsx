import React from 'react';
import {
  RotateCcw,
  Flag,
  Lightbulb,
  Handshake,
  Play,
  RotateCw
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
  isGameActive,
  isThinking
}) {
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return '∞';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isPlayerTurn = gameState?.turn === playerColor;

  return (
    <div className="mode-panel glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Turn Banner */}
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isPlayerTurn ? 'Your Turn' : `${activePersona?.name} is thinking...`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {isPlayerTurn ? `Playing as ${playerColor === 'w' ? 'White ⚪' : 'Black ⚫'}` : 'Calculating optimal move'}
          </div>
        </div>

        <span className={`badge ${isPlayerTurn ? 'badge-emerald' : 'badge-cyan'}`}>
          {isPlayerTurn ? 'Your Move' : 'AI Thinking'}
        </span>
      </div>

      {/* Clocks (if timed) */}
      {timeControl.initial !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div
            style={{
              padding: '6px 10px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{playerColor === 'w' ? 'You' : activePersona?.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>
              {formatTime(whiteTime)}
            </span>
          </div>

          <div
            style={{
              padding: '6px 10px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{playerColor === 'b' ? 'You' : activePersona?.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>
              {formatTime(blackTime)}
            </span>
          </div>
        </div>
      )}

      {/* Difficulty Level Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
            AI DIFFICULTY
          </span>
          <span className="badge badge-good">Elo {activePersona?.elo}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
          {AI_PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p)}
              className={`btn-secondary ${activePersona?.id === p.id ? 'active' : ''}`}
              style={{
                flexDirection: 'column',
                padding: '6px 2px',
                gap: '2px',
                fontSize: '10px'
              }}
              title={`${p.name} (${p.elo})`}
            >
              <span>{p.avatar}</span>
              <span style={{ fontWeight: 700 }}>{p.elo}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Play As White / Black Toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button
          className={`btn-secondary ${playerColor === 'w' ? 'active' : ''}`}
          onClick={() => onSetPlayerColor('w')}
          style={{ fontSize: '12px', padding: '6px' }}
        >
          ⚪ Play as White
        </button>
        <button
          className={`btn-secondary ${playerColor === 'b' ? 'active' : ''}`}
          onClick={() => onSetPlayerColor('b')}
          style={{ fontSize: '12px', padding: '6px' }}
        >
          ⚫ Play as Black
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        <button className="btn-secondary" onClick={onGetHint} title="Engine Best Move Hint (H)">
          <Lightbulb size={14} color="var(--accent-amber)" />
          <span style={{ fontSize: '11px' }}>Hint</span>
        </button>
        <button className="btn-secondary" onClick={onTakeback} title="Undo Move">
          <RotateCcw size={14} />
          <span style={{ fontSize: '11px' }}>Undo</span>
        </button>
        <button className="btn-secondary" onClick={onOfferDraw} title="Offer Draw">
          <Handshake size={14} />
          <span style={{ fontSize: '11px' }}>Draw</span>
        </button>
        <button className="btn-danger" onClick={onResign} title="Resign">
          <Flag size={14} />
          <span style={{ fontSize: '11px' }}>Resign</span>
        </button>
      </div>

      {/* Start / Reset Match Button */}
      <button
        className="btn-primary"
        onClick={onStartGame}
        style={{ width: '100%', marginTop: '2px' }}
      >
        <Play size={14} /> New Game vs AI
      </button>
    </div>
  );
}
