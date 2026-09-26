import React, { memo } from 'react';
import { PieceIcon } from './PieceIcons';

export function Square({
  square,
  isDark,
  piece,
  isSelected,
  isLegalMove,
  isCaptureTarget,
  isLastMove,
  isLastMoveDest,
  isCheck,
  isHighlighted,
  heatmapIntensity = 0,
  showHeatmap = false,
  showCoordinates = true,
  fileLabel = '',
  rankLabel = '',
  pieceStyle = 'neo',
  moveKey,
  onClick,
  onMouseDown,
  onMouseEnter,
  onDragStart,
  onDragOver,
  onDrop
}) {
  let heatmapStyle = {};
  if (showHeatmap && Math.abs(heatmapIntensity) > 0.05) {
    heatmapStyle = heatmapIntensity > 0
      ? { backgroundColor: `rgba(56,189,248,${Math.min(0.45, heatmapIntensity * 0.45)})` }
      : { backgroundColor: `rgba(244,63,94,${Math.min(0.45, Math.abs(heatmapIntensity) * 0.45)})` };
  }

  const squareClasses = [
    'chess-square',
    isDark ? 'square-dark' : 'square-light',
    isSelected      ? 'square-selected'        : '',
    isLastMove      ? 'square-lastmove'         : '',
    isCheck         ? 'square-check'            : '',
    isHighlighted   ? 'square-custom-highlight' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={squareClasses}
      style={heatmapStyle}
      onClick={() => onClick(square)}
      onMouseDown={(e) => onMouseDown && onMouseDown(e, square)}
      onMouseEnter={() => onMouseEnter && onMouseEnter(square)}
      onDragOver={(e) => { e.preventDefault(); if (onDragOver) onDragOver(e, square); }}
      onDrop={(e) => { e.preventDefault(); if (onDrop) onDrop(e, square); }}
      data-square={square}
    >
      {/* Coordinates */}
      {showCoordinates && fileLabel && (
        <span className={`coord-file ${isDark ? 'coord-dark' : 'coord-light'}`}>{fileLabel}</span>
      )}
      {showCoordinates && rankLabel && (
        <span className={`coord-rank ${isDark ? 'coord-dark' : 'coord-light'}`}>{rankLabel}</span>
      )}

      {/* Piece — key changes on move-to so React remounts → CSS animation fires */}
      {piece && (
        <div
          key={moveKey || `${square}-${piece.type}-${piece.color}`}
          className={`piece-wrapper ${piece.color === 'w' ? 'piece-white' : 'piece-black'} ${isLastMoveDest ? 'piece-just-landed' : ''}`}
          draggable
          onDragStart={(e) => onDragStart && onDragStart(e, square, piece)}
        >
          <PieceIcon piece={piece.type} color={piece.color} />
        </div>
      )}

      {/* Legal move indicators */}
      {isLegalMove && !isCaptureTarget && <div className="legal-move-dot" />}
      {isCaptureTarget && <div className="legal-capture-ring" />}
    </div>
  );
}

// Memoize: only re-render when this square's own props change.
// Without this, clicking any square triggers all 64 squares to re-render.
export const MemoSquare = memo(Square);
