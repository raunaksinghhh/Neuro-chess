import React from 'react';

export function PieceIcon({ piece, color }) {
  const isW = color === 'w';
  const uid = `${piece}${color}`;

  // Color system
  const light1 = '#f5f0e6';
  const light2 = '#c8bfa8';
  const dark1  = '#4a5568';
  const dark2  = '#1a202c';
  const strokeW = '#1a1f2e';
  const strokeB = '#0a0f1a';

  const fill1  = isW ? light1 : dark1;
  const fill2  = isW ? light2 : dark2;
  const stroke = isW ? strokeW : strokeB;
  const hl     = isW ? 'rgba(255,255,255,0.55)' : 'rgba(148,163,184,0.13)';
  const accent = isW ? '#9ca3af' : '#6b7280';
  const sw     = 1.5;

  const defs = (
    <defs>
      <linearGradient id={`lg${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%"   stopColor={fill1} />
        <stop offset="100%" stopColor={fill2} />
      </linearGradient>
      <radialGradient id={`rg${uid}`} cx="35%" cy="25%" r="60%">
        <stop offset="0%"   stopColor={hl} />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
  );

  const gp = {
    fill: `url(#lg${uid})`,
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const ov = (d, extra = {}) => (
    <path d={d} fill={`url(#rg${uid})`} stroke="none" {...extra} />
  );

  const sv = { viewBox: '0 0 45 45', width: '100%', height: '100%', style: { display: 'block', overflow: 'visible' } };

  switch (piece) {
    /* ──────────── PAWN ──────────── */
    case 'p': {
      const body = 'M 19.5,16 C 15.5,18.5 13.5,23 13.5,27 C 13.5,30 15.5,32 18,33 L 27,33 C 29.5,32 31.5,30 31.5,27 C 31.5,23 29.5,18.5 25.5,16 Z';
      const base = 'M 10,37 C 10,39 15.5,40.5 22.5,40.5 C 29.5,40.5 35,39 35,37 L 33,33 L 12,33 Z';
      return (
        <svg {...sv}>{defs}
          <circle cx="22.5" cy="10"  r="5.5" {...gp} />
          <path d={body} {...gp} />
          <path d={base} {...gp} />
          <circle cx="22.5" cy="10" r="5.5" fill={`url(#rg${uid})`} stroke="none" />
          {ov(body)}
        </svg>
      );
    }

    /* ──────────── KNIGHT ──────────── */
    case 'n': {
      const horse = 'M 22,10 C 29,9 37,15 37,27 C 37,32 34.5,34.5 30,35.5 L 27,35.5 C 25.5,30 23.5,27.5 20.5,27 C 17.5,27 16.5,28.5 15.5,31 C 14.5,33.5 12.5,36 8.5,36 C 7.5,27 9.5,19.5 15.5,13.5 C 13.5,13.5 11.5,15 9.5,18 C 9.5,13.5 12.5,8.5 17.5,7.5 C 19.5,7 20.5,8 22,10 Z';
      return (
        <svg {...sv}>{defs}
          <path d={horse} {...gp} />
          {/* Eye */}
          <circle cx="15"   cy="16.5" r="2"   fill={isW ? '#1e293b' : '#e2e8f0'} stroke="none" />
          <circle cx="15.4" cy="16"   r="0.7" fill={isW ? '#60a5fa' : '#818cf8'} stroke="none" />
          {/* Nostril */}
          <circle cx="13" cy="19.5" r="1.1" fill={accent} stroke="none" />
          {/* Mane line */}
          <path d="M 22,10 C 25,12 27,16 27,21" stroke={accent} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* Base */}
          <path d="M 7,36 C 7,39 12.5,40.5 22.5,40.5 C 32.5,40.5 38,39 38,36 Z" {...gp} />
          {ov(horse)}
        </svg>
      );
    }

    /* ──────────── BISHOP ──────────── */
    case 'b': {
      const body = 'M 18.5,35 C 14,28.5 14,17 20,11.5 C 21.5,10 24,10 25.5,11.5 C 31.5,17 31.5,28.5 27,35 Z';
      const base = 'M 10,37 C 10,39 15.5,40.5 22.5,40.5 C 29.5,40.5 35,39 35,37 L 33,35 L 12,35 Z';
      return (
        <svg {...sv}>{defs}
          <circle cx="22.5" cy="8" r="3" {...gp} />
          <path d={body} {...gp} />
          {/* Cross */}
          <path d="M 22.5,15 L 22.5,27 M 17.5,21 L 27.5,21"
            stroke={accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Waist band */}
          <path d="M 18,33 L 27,33" stroke={accent} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d={base} {...gp} />
          {ov(body)}
        </svg>
      );
    }

    /* ──────────── ROOK ──────────── */
    case 'r': {
      const crenels = 'M 11,20 L 11,14 L 14,14 L 14,18 L 18,18 L 18,14 L 22,14 L 22,18 L 27,18 L 27,14 L 31,14 L 31,18 L 34,18 L 34,14 L 34,20 Z';
      const body    = 'M 11,20 L 11,35 L 34,35 L 34,20 Z';
      const base    = 'M 9,37 C 9,39 15,40.5 22.5,40.5 C 30,40.5 36,39 36,37 L 34,35 L 11,35 Z';
      return (
        <svg {...sv}>{defs}
          <path d={crenels} {...gp} />
          <path d={body}    {...gp} />
          <path d="M 13,22 L 32,22" stroke={accent} strokeWidth="1.2" fill="none" />
          <path d={base}    {...gp} />
          {ov(body)}
        </svg>
      );
    }

    /* ──────────── QUEEN ──────────── */
    case 'q': {
      const crownBody = 'M 9,14 L 13.5,30 L 31.5,30 L 36,14 L 30,22 L 22.5,12 L 15,22 Z';
      const skirt     = 'M 13.5,30 L 12,34 L 33,34 L 31.5,30 Z';
      const base      = 'M 10,37 C 10,39 15.5,40.5 22.5,40.5 C 29.5,40.5 35,39 35,37 L 33,34 L 12,34 Z';
      return (
        <svg {...sv}>{defs}
          <circle cx="8.5"  cy="12" r="2.8" {...gp} />
          <circle cx="15.5" cy="9"  r="2.8" {...gp} />
          <circle cx="22.5" cy="7.5" r="3"  {...gp} />
          <circle cx="29.5" cy="9"  r="2.8" {...gp} />
          <circle cx="36.5" cy="12" r="2.8" {...gp} />
          <path d={crownBody} {...gp} />
          <path d={skirt}     {...gp} />
          <path d={base}      {...gp} />
          {ov(crownBody)}
        </svg>
      );
    }

    /* ──────────── KING ──────────── */
    case 'k': {
      const crown = 'M 15,20 C 11,13 20.5,8 22.5,13 C 24.5,8 34,13 30,20 C 27,25 25,27.5 22.5,28.5 C 20,27.5 18,25 15,20 Z';
      const skirt = 'M 14,28.5 L 11,35 L 34,35 L 31,28.5 Z';
      const base  = 'M 9,37 C 9,39 15,40.5 22.5,40.5 C 30,40.5 36,39 36,37 L 34,35 L 11,35 Z';
      return (
        <svg {...sv}>{defs}
          {/* Cross */}
          <path d="M 22.5,4 L 22.5,12.5" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M 18,8 L 27,8" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
          {isW && <path d="M 18.5,8 L 26.5,8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />}
          <path d={crown} {...gp} />
          <path d={skirt} {...gp} />
          <path d={base}  {...gp} />
          {ov(crown)}
          {ov(skirt)}
        </svg>
      );
    }

    default: return null;
  }
}
