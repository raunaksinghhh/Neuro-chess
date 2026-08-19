import React from 'react';
import { X, Volume2, VolumeX, Palette, Cpu, Check } from 'lucide-react';

export function SettingsModal({
  isOpen,
  onClose,
  boardTheme,
  onSetBoardTheme,
  pieceStyle,
  onSetPieceStyle,
  soundEnabled,
  onToggleSound,
  soundVolume,
  onSetSoundVolume,
  showCoordinates,
  onToggleCoordinates,
  autoQueen,
  onToggleAutoQueen,
  externalEngineUrl,
  onSetExternalEngineUrl
}) {
  if (!isOpen) return null;

  const themes = [
    { id: 'cyber', name: 'Cyber Neon', color: '#00f0ff' },
    { id: 'emerald', name: 'Emerald Forest', color: '#10b981' },
    { id: 'obsidian', name: 'Obsidian Gold', color: '#eab308' },
    { id: 'amethyst', name: 'Royal Amethyst', color: '#a855f7' },
    { id: 'classic', name: 'Classic Tournament', color: '#b58863' },
    { id: 'slate', name: 'Slate Blue', color: '#64748b' }
  ];

  return (
    <div className="promotion-backdrop" onClick={onClose}>
      <div
        className="glass-panel-glow"
        style={{
          width: '90%',
          maxWidth: '480px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Settings & Preferences
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Board Theme Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={14} /> BOARD THEME
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => onSetBoardTheme(t.id)}
                className={`btn-secondary ${boardTheme === t.id ? 'active' : ''}`}
                style={{
                  padding: '8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: boardTheme === t.id ? t.color : 'var(--border-subtle)'
                }}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.color }} />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Audio Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} AUDIO
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>Sound Effects</span>
            <button
              className={`badge ${soundEnabled ? 'badge-cyan' : 'badge-good'}`}
              onClick={onToggleSound}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>
          {soundEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={soundVolume}
                onChange={(e) => onSetSoundVolume(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--neon-cyan)' }}
              />
            </div>
          )}
        </div>

        {/* Board Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>Show Board Coordinates</span>
            <button
              className={`badge ${showCoordinates ? 'badge-cyan' : 'badge-good'}`}
              onClick={onToggleCoordinates}
            >
              {showCoordinates ? 'On' : 'Off'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>Auto-Promote Pawns to Queen</span>
            <button
              className={`badge ${autoQueen ? 'badge-cyan' : 'badge-good'}`}
              onClick={onToggleAutoQueen}
            >
              {autoQueen ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Custom Engine Backend Connector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} /> CUSTOM ENGINE BACKEND (OPTIONAL)
          </div>
          <input
            type="text"
            placeholder="http://localhost:8000/eval"
            value={externalEngineUrl}
            onChange={(e) => onSetExternalEngineUrl(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px'
            }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Point to any custom FastAPI / PyTorch / Stockfish UCI HTTP or WebSocket server.
          </span>
        </div>
      </div>
    </div>
  );
}
