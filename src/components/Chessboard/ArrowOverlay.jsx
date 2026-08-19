import React from 'react';

function squareToCoords(sq, orientation = 'white') {
  if (!sq || sq.length < 2) return { x: 0, y: 0 };
  const file = sq.charCodeAt(0) - 97; // 'a' -> 0, 'h' -> 7
  const rank = parseInt(sq[1], 10) - 1; // '1' -> 0, '8' -> 7

  let col = file;
  let row = 7 - rank;

  if (orientation === 'black') {
    col = 7 - file;
    row = rank;
  }

  return {
    x: col * 12.5 + 6.25,
    y: row * 12.5 + 6.25
  };
}

export function ArrowOverlay({
  engineArrow = null,
  threatArrows = [],
  userArrows = [],
  orientation = 'white'
}) {
  const renderArrow = (fromSq, toSq, color, glowColor, id, isDotted = false) => {
    const p1 = squareToCoords(fromSq, orientation);
    const p2 = squareToCoords(toSq, orientation);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const length = Math.sqrt(dx * dx + dy * dy);

    // Shorten end slightly so arrowhead looks perfect
    const shortenBy = 3.5;
    const endX = p1.x + (dx * (length - shortenBy)) / length;
    const endY = p1.y + (dy * (length - shortenBy)) / length;

    return (
      <g key={id} className="arrow-group">
        <defs>
          <marker
            id={`head-${id}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill={color} />
          </marker>
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow backdrop line */}
        <line
          x1={`${p1.x}%`}
          y1={`${p1.y}%`}
          x2={`${endX}%`}
          y2={`${endY}%`}
          stroke={glowColor}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.6"
          filter={`url(#glow-${id})`}
        />

        {/* Core arrow line */}
        <line
          x1={`${p1.x}%`}
          y1={`${p1.y}%`}
          x2={`${endX}%`}
          y2={`${endY}%`}
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={isDotted ? '4,4' : 'none'}
          markerEnd={`url(#head-${id})`}
        />
      </g>
    );
  };

  return (
    <svg className="chessboard-arrow-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
      {/* Threat Arrows */}
      {threatArrows.map((threat, idx) =>
        renderArrow(threat.from, threat.to, '#f43f5e', 'rgba(244, 63, 94, 0.4)', `threat-${idx}`)
      )}

      {/* Engine Best Move Arrow */}
      {engineArrow &&
        renderArrow(
          engineArrow.from,
          engineArrow.to,
          '#00f0ff',
          'rgba(0, 240, 255, 0.5)',
          'engine-best'
        )}

      {/* User Drawn Arrows */}
      {userArrows.map((ua, idx) =>
        renderArrow(ua.from, ua.to, ua.color || '#eab308', 'rgba(234, 179, 8, 0.4)', `user-${idx}`)
      )}
    </svg>
  );
}
