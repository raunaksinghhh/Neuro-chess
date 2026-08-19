// Tactical Chess Puzzles with FEN, Solution sequence, themes and ratings

export const CHESS_PUZZLES = [
  {
    id: 'puz-1',
    title: 'Smothered Queen Sacrifice Mate',
    rating: 1450,
    theme: 'Back Rank Mate & Deflection',
    fen: '6k1/5ppp/8/8/8/8/1Q3PPP/6K1 w - - 0 1',
    playerColor: 'w',
    description: 'Find the decisive mate on the vulnerable back rank.',
    moves: ['Qb8#'],
    hint: 'Look for the undefended 8th rank.'
  },
  {
    id: 'puz-2',
    title: 'Royal Knight Fork',
    rating: 1200,
    theme: 'Tactical Fork',
    fen: 'r1b1k2r/pppp1ppp/8/4n3/1bP5/2N1P3/PP1B1PPP/R3KB1R b KQkq - 1 9',
    playerColor: 'b',
    description: 'White king and rook are in a tactical fork alignment.',
    moves: ['Nd3+', 'Ke2', 'Nxf2'],
    hint: 'Look for a checking square that attacks an undefended piece.'
  },
  {
    id: 'puz-3',
    title: 'Opera House Deflection Mate',
    rating: 1650,
    theme: 'Attraction & Queen Sacrifice',
    fen: 'rn2kb1r/p4ppp/2p5/4q3/4n3/1BN5/PPP2PPP/R1BQK2R w KQkq - 0 11',
    playerColor: 'w',
    description: 'Punish the centralized uncastled king.',
    moves: ['Qe2', 'f5', 'f3'],
    hint: 'Pin the pinned knight against the queen.'
  },
  {
    id: 'puz-4',
    title: 'Greek Gift Classic Sacrifice',
    rating: 1800,
    theme: 'Kingside Attack',
    fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 4 7',
    playerColor: 'w',
    description: 'Launch the decisive attack on the h7 pawn.',
    moves: ['Bxh7+', 'Kxh7', 'Ng5+'],
    hint: 'A famous bishop sacrifice opens up the enemy king.'
  },
  {
    id: 'puz-5',
    title: 'Anastasia Mate Theme',
    rating: 1950,
    theme: 'Checkmate Pattern',
    fen: '5rk1/1p3ppp/8/3N4/8/8/5PPP/4R1K1 w - - 0 1',
    playerColor: 'w',
    description: 'Knight controls the escape squares while the rook seals the file.',
    moves: ['Ne7+', 'Kh8', 'Re3', 'g6', 'Rh3#'],
    hint: 'Use the knight to herd the king into the corner.'
  },
  {
    id: 'puz-6',
    title: 'Deadly Bishop Skewer',
    rating: 1350,
    theme: 'Skewer',
    fen: '8/8/4k3/8/8/2B5/4K3/r7 w - - 0 1',
    playerColor: 'w',
    description: 'White can win the rook or neutralize the threat.',
    moves: ['Bxa1'],
    hint: 'Capture the hanging rook.'
  },
  {
    id: 'puz-7',
    title: 'Double Attack with Queen',
    rating: 1500,
    theme: 'Fork / Double Attack',
    fen: 'r1bqk2r/pppp1ppp/2n5/4p3/2B1n3/2P2N2/PPP2PPP/R1BQK2R w KQkq - 0 6',
    playerColor: 'w',
    description: 'White has a tactical double attack against the exposed knight and pawn.',
    moves: ['Qd5', 'Nd6', 'Qxf7#'],
    hint: 'Target f7 and the centralized knight simultaneously.'
  }
];
