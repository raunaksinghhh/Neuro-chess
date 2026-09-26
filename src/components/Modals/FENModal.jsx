import React, { useState } from 'react';
import { X, Copy, Upload, Check } from 'lucide-react';

export function FENModal({ isOpen, onClose, currentFEN, currentPGN, onLoadFEN, onLoadPGN }) {
  const [activeTab, setActiveTab] = useState('fen');
  const [inputVal, setInputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoad = () => {
    setErrorMsg('');
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    if (activeTab === 'fen') {
      const success = onLoadFEN(trimmed);
      if (success) {
        onClose();
      } else {
        setErrorMsg('Invalid FEN position string. Please verify standard FEN formatting.');
      }
    } else {
      const success = onLoadPGN(trimmed);
      if (success) {
        onClose();
      } else {
        setErrorMsg('Invalid PGN notation. Please check syntax.');
      }
    }
  };

  return (
    <div className="promotion-backdrop" onClick={onClose}>
      <div
        className="glass-panel-glow"
        style={{
          width: '90%',
          maxWidth: '520px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn-secondary ${activeTab === 'fen' ? 'active' : ''}`}
              onClick={() => { setActiveTab('fen'); setErrorMsg(''); }}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              FEN Position
            </button>
            <button
              className={`btn-secondary ${activeTab === 'pgn' ? 'active' : ''}`}
              onClick={() => { setActiveTab('pgn'); setErrorMsg(''); }}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              PGN Game
            </button>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Current Value Display & Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
              CURRENT {activeTab.toUpperCase()}
            </span>
            <button
              className="btn-secondary"
              onClick={() => handleCopy(activeTab === 'fen' ? currentFEN : currentPGN)}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            readOnly
            value={activeTab === 'fen' ? currentFEN : currentPGN}
            rows={activeTab === 'fen' ? 2 : 4}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '8px',
              resize: 'none'
            }}
          />
        </div>

        {/* Paste & Import Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
            IMPORT CUSTOM {activeTab.toUpperCase()}
          </span>
          <textarea
            placeholder={activeTab === 'fen' ? 'Paste FEN string here (e.g. r1bqkbnr/pppp1ppp/...)' : 'Paste PGN text here (e.g. 1. e4 e5 2. Nf3...)'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              padding: '8px'
            }}
          />
        </div>

        {errorMsg && (
          <div style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '4px' }}>
            {errorMsg}
          </div>
        )}

        <button className="btn-primary" onClick={handleLoad} style={{ width: '100%' }}>
          <Upload size={16} /> Load {activeTab.toUpperCase()} into Board
        </button>
      </div>
    </div>
  );
}
