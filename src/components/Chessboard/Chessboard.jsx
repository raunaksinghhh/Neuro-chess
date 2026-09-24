import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Square } from './Square';
import { ArrowOverlay } from './ArrowOverlay';
import { PromotionModal } from './PromotionModal';
import './Chessboard.css';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function Chessboard({
  chess,
  onMove,
  orientation = 'white',
  boardTheme = 'cyber',
  pieceStyle = 'neo',
  showCoordinates = true,
  showHeatmap = false,
  heatmapData = null,
  engineArrow = null,
  threatArrows = [],
  lastMove = null,
  isInteractive = true,
  autoQueen = false
}) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to }
  const [userArrows, setUserArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState(new Set());
  const rightClickStartRef = useRef(null);

  // Clear selection if board changes externally
  useEffect(() => {
    setSelectedSquare(null);
  }, [chess?.fen()]);

  // Compute legal moves for selected square
  const legalMoves = useMemo(() => {
    if (!selectedSquare || !chess || !isInteractive) return [];
    try {
      return chess.moves({ square: selectedSquare, verbose: true });
    } catch {
      return [];
    }
  }, [selectedSquare, chess, isInteractive]);

  // Map legal targets for fast lookup
  const legalTargetsMap = useMemo(() => {
    const map = new Map();
    legalMoves.forEach((m) => {
      map.set(m.to, m);
    });
    return map;
  }, [legalMoves]);

  // Check state & King square
  const inCheck = chess ? chess.inCheck() : false;
  const kingCheckSquare = useMemo(() => {
    if (!inCheck || !chess) return null;
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          return `${FILES[c]}${8 - r}`;
        }
      }
    }
    return null;
  }, [inCheck, chess]);

  // Handle Square Selection & Move Dispatch
  const handleSquareClick = (square) => {
    if (!isInteractive) return;

    // Clear user arrows on left-click
    if (userArrows.length > 0 || highlightedSquares.size > 0) {
      setUserArrows([]);
      setHighlightedSquares(new Set());
    }

    if (!selectedSquare) {
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
      }
      return;
    }

    // Deselect if clicked same square
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    // Check if target is a legal move
    const matchedMove = legalTargetsMap.get(square);

    if (matchedMove) {
      // Check for pawn promotion
      const piece = chess.get(selectedSquare);
      const isPromotion =
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && square.endsWith('8')) ||
          (piece.color === 'b' && square.endsWith('1')));

      if (isPromotion && !autoQueen) {
        setPendingPromotion({ from: selectedSquare, to: square, color: piece.color });
        return;
      }

      // Execute move
      const promoPiece = isPromotion ? 'q' : undefined;
      onMove({ from: selectedSquare, to: square, promotion: promoPiece });
      setSelectedSquare(null);
    } else {
      // If clicking another of player's own pieces, switch selection
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  const handlePromotionSelect = (promotionPiece) => {
    if (pendingPromotion) {
      onMove({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: promotionPiece
      });
      setPendingPromotion(null);
      setSelectedSquare(null);
    }
  };

  // Drag-and-Drop handlers
  const handleDragStart = (e, square, piece) => {
    if (!isInteractive) return;
    if (piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setSelectedSquare(square);
    e.dataTransfer.setData('text/plain', square);
  };

  const handleDrop = (e, targetSquare) => {
    e.preventDefault();
    if (!isInteractive || !selectedSquare) return;

    const fromSquare = e.dataTransfer.getData('text/plain') || selectedSquare;
    if (fromSquare === targetSquare) return;

    const matchedMove = legalTargetsMap.get(targetSquare);
    if (matchedMove) {
      const piece = chess.get(fromSquare);
      const isPromotion =
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && targetSquare.endsWith('8')) ||
          (piece.color === 'b' && targetSquare.endsWith('1')));

      if (isPromotion && !autoQueen) {
        setPendingPromotion({ from: fromSquare, to: targetSquare, color: piece.color });
        return;
      }

      onMove({ from: fromSquare, to: targetSquare, promotion: isPromotion ? 'q' : undefined });
      setSelectedSquare(null);
    }
  };

  // Right-click drawing & highlight handlers
  const handleMouseDown = (e, square) => {
    if (e.button === 2) {
      // Right-click
      e.preventDefault();
      rightClickStartRef.current = square;
    }
  };

  const handleMouseUp = (e, square) => {
    if (e.button === 2 && rightClickStartRef.current) {
      e.preventDefault();
      const startSq = rightClickStartRef.current;
      rightClickStartRef.current = null;

      if (startSq === square) {
        // Toggle square highlight
        setHighlightedSquares((prev) => {
          const next = new Set(prev);
          if (next.has(square)) {
            next.delete(square);
          } else {
            next.add(square);
          }
          return next;
        });
      } else {
        // Toggle arrow
        setUserArrows((prev) => {
          const existingIdx = prev.findIndex((a) => a.from === startSq && a.to === square);
          if (existingIdx >= 0) {
            return prev.filter((_, idx) => idx !== existingIdx);
          } else {
            return [...prev, { from: startSq, to: square, color: '#eab308' }];
          }
        });
      }
    }
  };

  // Build 64 squares list based on board orientation
  const ranksList = orientation === 'black' ? [...RANKS].reverse() : RANKS;
  const filesList = orientation === 'black' ? [...FILES].reverse() : FILES;

  const squares = [];
  for (let rIdx = 0; rIdx < 8; rIdx++) {
    for (let fIdx = 0; fIdx < 8; fIdx++) {
      const file = filesList[fIdx];
      const rank = ranksList[rIdx];
      const square = `${file}${rank}`;

      const fileNum = file.charCodeAt(0) - 97;
      const rankNum = parseInt(rank, 10);
      const isDark = (fileNum + rankNum) % 2 === 0;

      const piece = chess ? chess.get(square) : null;
      const isSelected = selectedSquare === square;
      const isLegal = legalTargetsMap.has(square);
      const isCapture = isLegal && piece !== null;
      const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
      const isLastDest = !!(lastMove && lastMove.to === square);
      const isKingInCheck = inCheck && kingCheckSquare === square;
      const isCustomHighlighted = highlightedSquares.has(square);

      // Unique key that changes every time a piece arrives at this square
      const moveKey = isLastDest ? `${lastMove.from}->${square}` : undefined;

      // Coordinate labels on edges
      const fileLabel = rIdx === 7 ? file : '';
      const rankLabel = fIdx === 0 ? rank : '';

      // Heatmap value for square
      let heatmapVal = 0;
      if (showHeatmap && heatmapData?.controlMatrix) {
        const originalR = 8 - parseInt(rank, 10);
        const originalC = file.charCodeAt(0) - 97;
        heatmapVal = heatmapData.controlMatrix[originalR]?.[originalC] || 0;
      }

      squares.push(
        <Square
          key={square}
          square={square}
          isDark={isDark}
          piece={piece}
          isSelected={isSelected}
          isLegalMove={isLegal}
          isCaptureTarget={isCapture}
          isLastMove={isLast}
          isLastMoveDest={isLastDest}
          isCheck={isKingInCheck}
          isHighlighted={isCustomHighlighted}
          heatmapIntensity={heatmapVal}
          showHeatmap={showHeatmap}
          showCoordinates={showCoordinates}
          fileLabel={fileLabel}
          rankLabel={rankLabel}
          pieceStyle={pieceStyle}
          moveKey={moveKey}
          onClick={handleSquareClick}
          onMouseDown={handleMouseDown}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
        />
      );
    }
  }

  return (
    <div
      className={`chessboard-container theme-${boardTheme}`}
      onContextMenu={(e) => e.preventDefault()}
      onMouseUp={(e) => handleMouseUp(e, e.target.closest('[data-square]')?.dataset?.square)}
    >
      <div className="chessboard-grid">{squares}</div>

      {/* SVG Arrows for Engine, Threats, and User Drawings */}
      <ArrowOverlay
        engineArrow={engineArrow}
        threatArrows={threatArrows}
        userArrows={userArrows}
        orientation={orientation}
      />

      {/* Pawn Promotion Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.color}
          pieceStyle={pieceStyle}
          onSelect={handlePromotionSelect}
        />
      )}
    </div>
  );
}
