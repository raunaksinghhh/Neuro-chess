import React from 'react';
import { PieceIcon } from './PieceIcons';

export function Square({
  square,
  isDark,
  piece,
  isSelected,
  isLegalMove,
  isCaptureTarget,
  isLastMove,
  isCheck,
  isHighlighted,
  heatmapIntensity = 0, // -1 (Black) to +1 (White)
  showHeatmap = false,
  showCoordinates = true,
  fileLabel = '',
  rankLabel = '',
  pieceStyle = 'neo',
  onClick,
  onMouseDown,
  onMouseEnter,
  onDragStart,
  onDragOver,
  onDrop
}) {
  // Compute heatmap background style if enabled
  let heatmapStyle = {};
  if (showHeatmap && Math.abs(heatmapIntensity) > 0.05) {
    if (heatmapIntensity > 0) {
      heatmapStyle = {
        backgroundColor: `rgba(0, 240, 255, ${Math.min(0.45, heatmapIntensity * 0.45)})`
      };
    } else {
      heatmapStyle = {
        backgroundColor: `rgba(244, 63, 94, ${Math.min(0.45, Math.abs(heatmapIntensity) * 0.45)})`
      };
    }
  }

  return (
    <div
      className={`chess-square ${isDark ? 'square-dark' : 'square-light'} ${
        isSelected ? 'square-selected' : ''
      } ${isLastMove ? 'square-lastmove' : ''} ${isCheck ? 'square-check' : ''} ${
        isHighlighted ? 'square-custom-highlight' : ''
      }`}
      style={heatmapStyle}
      onClick={() => onClick(square)}
      onMouseDown={(e) => onMouseDown && onMouseDown(e, square)}
      onMouseEnter={() => onMouseEnter && onMouseEnter(square)}
      onDragOver={(e) => {
        e.preventDefault();
        if (onDragOver) onDragOver(e, square);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (onDrop) onDrop(e, square);
      }}
      data-square={square}
    >
      {/* Rank / File Coordinate Labels */}
      {showCoordinates && fileLabel && (
        <span className={`coord-file ${isDark ? 'coord-dark' : 'coord-light'}`}>
          {fileLabel}
        </span>
      )}
      {showCoordinates && rankLabel && (
        <span className={`coord-rank ${isDark ? 'coord-dark' : 'coord-light'}`}>
          {rankLabel}
        </span>
      )}

      {/* Piece Container */}
      {piece && (
        <div
          className={`piece-wrapper ${piece.color === 'w' ? 'piece-white' : 'piece-black'}`}
          draggable={true}
          onDragStart={(e) => onDragStart && onDragStart(e, square, piece)}
        >
          <PieceIcon piece={piece.type} color={piece.color} style={pieceStyle} />
        </div>
      )}

      {/* Legal Move Indicators */}
      {isLegalMove && !isCaptureTarget && <div className="legal-move-dot" />}
      {isCaptureTarget && <div className="legal-capture-ring" />}
    </div>
  );
}
