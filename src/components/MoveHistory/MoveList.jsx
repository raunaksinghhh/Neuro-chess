import React, { useEffect, useRef } from 'react';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Copy,
  Download
} from 'lucide-react';
import './MoveList.css';

export function MoveList({
  history = [],
  currentMoveIndex = -1,
  onNavigate,
  onFlipBoard,
  onExportPGN,
  onCopyFEN,
  openingInfo = { name: 'Starting Position', eco: 'A00' }
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to active move
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('.active-move');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentMoveIndex]);

  // Group moves into pairs [White, Black]
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIdx: i,
      black: history[i + 1] || null,
      blackIdx: i + 1
    });
  }

  const renderBadge = (classification) => {
    if (!classification) return null;
    return (
      <span className={`move-badge badge-${classification.type}`} title={classification.label}>
        {classification.symbol}
      </span>
    );
  };

  return (
    <div className="movelist-container">
      {/* Header */}
      <div className="movelist-header">
        <div className="movelist-title-group">
          <div className="movelist-title">Move History</div>
          <div className="opening-tag" title={openingInfo.name}>
            {openingInfo.eco} • {openingInfo.name}
          </div>
        </div>
        <div className="control-btn-group">
          <button className="btn-icon" onClick={onCopyFEN} title="Copy FEN">
            <Copy size={15} />
          </button>
          <button className="btn-icon" onClick={onExportPGN} title="Export PGN">
            <Download size={15} />
          </button>
          <button className="btn-icon" onClick={onFlipBoard} title="Flip Board (F)">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Move Scroll Area */}
      <div className="movelist-scroll" ref={scrollRef}>
        {movePairs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
            No moves played yet.
          </div>
        ) : (
          movePairs.map((pair) => (
            <div key={pair.moveNumber} className="move-row">
              <span className="move-num">{pair.moveNumber}.</span>

              {/* White Move */}
              <div
                className={`move-cell ${currentMoveIndex === pair.whiteIdx ? 'active-move' : ''}`}
                onClick={() => onNavigate(pair.whiteIdx)}
              >
                <span>{pair.white.san || pair.white}</span>
                {renderBadge(pair.white.classification)}
              </div>

              {/* Black Move */}
              {pair.black ? (
                <div
                  className={`move-cell ${currentMoveIndex === pair.blackIdx ? 'active-move' : ''}`}
                  onClick={() => onNavigate(pair.blackIdx)}
                >
                  <span>{pair.black.san || pair.black}</span>
                  {renderBadge(pair.black.classification)}
                </div>
              ) : (
                <div />
              )}
            </div>
          ))
        )}
      </div>

      {/* Navigation Footer Controls */}
      <div className="movelist-controls">
        <div className="control-btn-group">
          <button
            className="btn-icon"
            onClick={() => onNavigate(-1)}
            disabled={currentMoveIndex === -1}
            title="Start (Arrow Up)"
          >
            <ChevronFirst size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={() => onNavigate(Math.max(-1, currentMoveIndex - 1))}
            disabled={currentMoveIndex === -1}
            title="Previous (Arrow Left)"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {currentMoveIndex + 1} / {history.length}
        </div>

        <div className="control-btn-group">
          <button
            className="btn-icon"
            onClick={() => onNavigate(Math.min(history.length - 1, currentMoveIndex + 1))}
            disabled={currentMoveIndex >= history.length - 1}
            title="Next (Arrow Right)"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={() => onNavigate(history.length - 1)}
            disabled={currentMoveIndex >= history.length - 1}
            title="Current Position (Arrow Down)"
          >
            <ChevronLast size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
