import React from 'react';

export function PieceIcon({ piece, color, style = 'neo', className = '' }) {
  const isWhite = color === 'w';

  // Cyber Neo Gradient Definitions & High-Detail Chess Piece Vectors
  const fillWhite = style === 'cyber' ? 'url(#whiteNeoGlow)' : (isWhite ? '#ffffff' : '#1e2029');
  const strokeWhite = style === 'cyber' ? '#00f0ff' : '#000000';
  const fillBlack = style === 'cyber' ? '#121524' : (isWhite ? '#f8fafc' : '#111827');
  const strokeBlack = style === 'cyber' ? '#a855f7' : (isWhite ? '#000000' : '#ffffff');

  const mainFill = isWhite ? '#f8fafc' : '#181a24';
  const mainStroke = isWhite ? '#334155' : '#e2e8f0';
  const glowStroke = isWhite ? '#00f0ff' : '#c084fc';

  switch (piece) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <defs>
            <linearGradient id={`pawnGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#ffffff' : '#2d3142'} />
              <stop offset="100%" stopColor={isWhite ? '#cbd5e1' : '#12141e'} />
            </linearGradient>
          </defs>
          <path
            d="m 22.5,9 a 4,4 0 1 1 -0.1,0 z"
            fill={`url(#pawnGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          <path
            d="m 22.5,10 c 3,7 5,8 5,12 0,4 -3,6 -5,6 -2,0 -5,-2 -5,-6 0,-4 2,-5 5,-12 z"
            fill={`url(#pawnGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          <path
            d="m 12,36 c 0,-3 4,-5 10.5,-5 6.5,0 10.5,2 10.5,5 0,1 -1,2 -1,2 H 13 c 0,0 -1,-1 -1,-2 z"
            fill={`url(#pawnGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          {style === 'cyber' && (
            <circle cx="22.5" cy="9" r="2" fill={glowStroke} opacity="0.8" />
          )}
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <defs>
            <linearGradient id={`knightGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#ffffff' : '#2d3142'} />
              <stop offset="100%" stopColor={isWhite ? '#cbd5e1' : '#12141e'} />
            </linearGradient>
          </defs>
          <path
            d="M 22,10 C 32.5,11 38.5,18 38,36 L 27,36 C 26,30 25.5,29 23,28 C 21.5,27.5 19,27 18.5,29 C 18,31 16,36 10,36 C 9,27 9,21 15,14 C 13,14 11,15.5 9,18 C 9,15 11,10 16,9 C 18,8.5 20,8.5 22,10 z"
            fill={`url(#knightGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="15" cy="18" r="1.5" fill={isWhite ? '#0284c7' : '#c084fc'} />
          <path
            d="M 12,36 C 12,38 15,39 22.5,39 C 30,39 33,38 33,36 z"
            fill={`url(#knightGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <defs>
            <linearGradient id={`bishopGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#ffffff' : '#2d3142'} />
              <stop offset="100%" stopColor={isWhite ? '#cbd5e1' : '#12141e'} />
            </linearGradient>
          </defs>
          <circle cx="22.5" cy="8" r="2.5" fill={`url(#bishopGrad-${color})`} stroke={isWhite ? '#1e293b' : '#94a3b8'} strokeWidth="1.5" />
          <path
            d="M 17,35 C 13,29 13,19 19,13 C 21,11 24,11 26,13 C 32,19 32,29 28,35 z"
            fill={`url(#bishopGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          <path d="M 22.5,16 L 22.5,26 M 19,20 L 26,20" stroke={isWhite ? '#1e293b' : '#c084fc'} strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M 12,36 C 12,39 16,40 22.5,40 C 29,40 33,39 33,36 z"
            fill={`url(#bishopGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <defs>
            <linearGradient id={`rookGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#ffffff' : '#2d3142'} />
              <stop offset="100%" stopColor={isWhite ? '#cbd5e1' : '#12141e'} />
            </linearGradient>
          </defs>
          <path
            d="M 11,36 L 34,36 L 34,39 L 11,39 z"
            fill={`url(#rookGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          <path
            d="M 14,36 L 14,26 L 31,26 L 31,36 z"
            fill={`url(#rookGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          <path
            d="M 12,26 L 12,14 L 16,14 L 16,18 L 20,18 L 20,14 L 25,14 L 25,18 L 29,18 L 29,14 L 33,14 L 33,26 z"
            fill={`url(#rookGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          <path d="M 14,20 L 31,20" stroke={isWhite ? '#334155' : '#c084fc'} strokeWidth="1.5" opacity="0.7" />
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <defs>
            <linearGradient id={`queenGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#ffffff' : '#2d3142'} />
              <stop offset="100%" stopColor={isWhite ? '#cbd5e1' : '#12141e'} />
            </linearGradient>
          </defs>
          <circle cx="8" cy="12" r="2" fill={isWhite ? '#0284c7' : '#c084fc'} />
          <circle cx="15" cy="9" r="2" fill={isWhite ? '#0284c7' : '#c084fc'} />
          <circle cx="22.5" cy="8" r="2.2" fill={isWhite ? '#0284c7' : '#c084fc'} />
          <circle cx="30" cy="9" r="2" fill={isWhite ? '#0284c7' : '#c084fc'} />
          <circle cx="37" cy="12" r="2" fill={isWhite ? '#0284c7' : '#c084fc'} />
          <path
            d="M 9,14 L 13,28 L 32,28 L 36,14 L 29,22 L 22.5,12 L 16,22 z"
            fill={`url(#queenGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M 11,36 L 34,36 L 34,39 L 11,39 z"
            fill={`url(#queenGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          <path
            d="M 13,28 L 11,36 L 34,36 L 32,28 z"
            fill={`url(#queenGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
        </svg>
      );

    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <defs>
            <linearGradient id={`kingGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#ffffff' : '#2d3142'} />
              <stop offset="100%" stopColor={isWhite ? '#cbd5e1' : '#12141e'} />
            </linearGradient>
          </defs>
          {/* King Crown Cross */}
          <path d="M 22.5,5 L 22.5,11 M 19.5,8 L 25.5,8" stroke={isWhite ? '#0284c7' : '#c084fc'} strokeWidth="2" strokeLinecap="round" />
          <path
            d="M 14,20 C 10,13 19,10 22.5,14 C 26,10 35,13 31,20 C 27,24 25,27 22.5,28 C 20,27 18,24 14,20 z"
            fill={`url(#kingGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          <path
            d="M 13,28 L 11,36 L 34,36 L 32,28 z"
            fill={`url(#kingGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
          <path
            d="M 11,36 L 34,36 L 34,39 L 11,39 z"
            fill={`url(#kingGrad-${color})`}
            stroke={isWhite ? '#1e293b' : '#94a3b8'}
            strokeWidth="1.5"
          />
        </svg>
      );

    default:
      return null;
  }
}
