import React from 'react';
import { PieceIcon } from './PieceIcons';

export function PromotionModal({ color, onSelect, pieceStyle = 'neo' }) {
  const pieces = ['q', 'n', 'r', 'b'];

  return (
    <div className="promotion-backdrop">
      <div className="promotion-modal glass-panel-glow">
        <h3 className="promotion-title">Select Promotion Piece</h3>
        <div className="promotion-grid">
          {pieces.map((p) => (
            <button
              key={p}
              className="promotion-btn"
              onClick={() => onSelect(p)}
              title={p.toUpperCase()}
            >
              <div className="promotion-icon-wrapper">
                <PieceIcon piece={p} color={color} style={pieceStyle} />
              </div>
              <span className="promotion-label">
                {p === 'q' ? 'Queen' : p === 'n' ? 'Knight' : p === 'r' ? 'Rook' : 'Bishop'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
