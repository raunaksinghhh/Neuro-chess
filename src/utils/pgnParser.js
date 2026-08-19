// Opening Database & PGN / FEN Utility Helpers

export const OPENINGS = [
  { pgn: 'e4 c5', name: 'Sicilian Defence', eco: 'B20' },
  { pgn: 'e4 e5 Nf3 Nc6 Bb5', name: 'Ruy Lopez', eco: 'C60' },
  { pgn: 'e4 e5 Nf3 Nc6 Bc4', name: 'Italian Game', eco: 'C50' },
  { pgn: 'e4 e6', name: 'French Defence', eco: 'C00' },
  { pgn: 'e4 c6', name: 'Caro-Kann Defence', eco: 'B10' },
  { pgn: 'd4 d5 c4', name: "Queen's Gambit", eco: 'D06' },
  { pgn: 'd4 Nf6 c4 g6', name: "King's Indian Defence", eco: 'E60' },
  { pgn: 'd4 Nf6 c4 e6 Nc3 Bb4', name: 'Nimzo-Indian Defence', eco: 'E20' },
  { pgn: 'd4 Nf6 c4 e6 Nf3 b6', name: "Queen's Indian Defence", eco: 'E12' },
  { pgn: 'd4 d5 Bf4', name: 'London System', eco: 'D00' },
  { pgn: 'd4 f5', name: 'Dutch Defence', eco: 'A80' },
  { pgn: 'c4', name: 'English Opening', eco: 'A10' },
  { pgn: 'Nf3', name: 'Réti Opening', eco: 'A04' },
  { pgn: 'e4 d5', name: 'Scandinavian Defence', eco: 'B01' },
  { pgn: 'e4 Nf6', name: "Alekhine's Defence", eco: 'B02' },
  { pgn: 'e4 g6', name: 'Modern Defence', eco: 'B06' },
  { pgn: 'e4 d6', name: 'Pirc Defence', eco: 'B07' },
  { pgn: 'd4 d5 c4 e6 Nc3 Nf6 Bg5', name: "Queen's Gambit Declined", eco: 'D35' },
  { pgn: 'd4 d5 c4 c6', name: 'Slav Defence', eco: 'D10' },
  { pgn: 'e4 e5 Nf3 Nf6', name: 'Petrov Defence', eco: 'C42' },
  { pgn: 'e4 e5 f4', name: "King's Gambit", eco: 'C30' },
  { pgn: 'e4 e5 Nf3 Nc6 d4', name: 'Scotch Game', eco: 'C45' },
  { pgn: 'e4 e5 Nf3 Nc6 Nc3', name: 'Three Knights Game', eco: 'C46' },
  { pgn: 'b3', name: "Nimzowitsch-Larsen Attack", eco: 'A01' },
  { pgn: 'g3', name: 'Benko Opening', eco: 'A00' },
];

export function detectOpening(moves) {
  if (!moves || moves.length === 0) return { name: 'Starting Position', eco: 'A00' };

  const cleanMoves = moves.map(m => (typeof m === 'string' ? m : m.san || m)).join(' ');
  
  let bestMatch = { name: 'Custom Opening', eco: 'A00' };
  let maxMatchedLength = 0;

  for (const op of OPENINGS) {
    if (cleanMoves.startsWith(op.pgn) && op.pgn.length > maxMatchedLength) {
      bestMatch = op;
      maxMatchedLength = op.pgn.length;
    }
  }

  return bestMatch;
}

export function exportPGN(gameHistory, whiteName = 'Human', blackName = 'NeuroEngine', result = '*') {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
  let pgn = `[Event "Neuro-Chess Arena"]\n`;
  pgn += `[Site "Neuro-Chess Web"]\n`;
  pgn += `[Date "${date}"]\n`;
  pgn += `[White "${whiteName}"]\n`;
  pgn += `[Black "${blackName}"]\n`;
  pgn += `[Result "${result}"]\n\n`;

  let moveText = '';
  for (let i = 0; i < gameHistory.length; i++) {
    if (i % 2 === 0) {
      moveText += `${Math.floor(i / 2) + 1}. `;
    }
    const san = typeof gameHistory[i] === 'string' ? gameHistory[i] : gameHistory[i].san;
    moveText += `${san} `;
  }

  pgn += moveText.trim() + ` ${result}\n`;
  return pgn;
}
