// Positional evaluation tables, Neural heuristic evaluation, and Heatmap / Attention calculations

export const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece-Square Tables (from White's perspective; mirrored for Black)
const PAWN_PST = [
   0,   0,   0,   0,   0,   0,   0,   0,
  50,  50,  50,  50,  50,  50,  50,  50,
  10,  10,  20,  30,  30,  20,  10,  10,
   5,   5,  10,  25,  25,  10,   5,   5,
   0,   0,   0,  20,  20,   0,   0,   0,
   5,  -5, -10,   0,   0, -10,  -5,   5,
   5,  10,  10, -20, -20,  10,  10,   5,
   0,   0,   0,   0,   0,   0,   0,   0
];

const KNIGHT_PST = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20,   0,   0,   0,   0, -20, -40,
  -30,   0,  10,  15,  15,  10,   0, -30,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -30,   0,  15,  20,  20,  15,   0, -30,
  -30,   5,  10,  15,  15,  10,   5, -30,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50
];

const BISHOP_PST = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -10,   0,   5,  10,  10,   5,   0, -10,
  -10,   5,   5,  10,  10,   5,   5, -10,
  -10,   0,  10,  10,  10,  10,   0, -10,
  -10,  10,  10,  10,  10,  10,  10, -10,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20
];

const ROOK_PST = [
    0,   0,   0,   0,   0,   0,   0,   0,
    5,  10,  10,  10,  10,  10,  10,   5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
    0,   0,   0,   5,   5,   0,   0,   0
];

const QUEEN_PST = [
  -20, -10, -10,  -5,  -5, -10, -10, -20,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -10,   0,   5,   5,   5,   5,   0, -10,
   -5,   0,   5,   5,   5,   5,   0,  -5,
    0,   0,   5,   5,   5,   5,   0,  -5,
  -10,   5,   5,   5,   5,   5,   0, -10,
  -10,   0,   5,   0,   0,   0,   0, -10,
  -20, -10, -10,  -5,  -5, -10, -10, -20
];

const KING_MIDDLE_PST = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
   20,  20,   0,   0,   0,   0,  20,  20,
   20,  30,  10,   0,   0,  10,  30,  20
];

const PST_MAP = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
  r: ROOK_PST,
  q: QUEEN_PST,
  k: KING_MIDDLE_PST
};

/**
 * Static evaluation function for a chess.js board
 * Returns score in centipawns from White's perspective (+ = White advantage, - = Black advantage)
 */
export function evaluateBoard(chess) {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99999 : 99999;
  }
  if (chess.isDraw() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0;
  }

  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whitePST = 0;
  let blackPST = 0;
  let whiteBishops = 0;
  let blackBishops = 0;

  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const type = piece.type;
      const isWhite = piece.color === 'w';
      const val = PIECE_VALUES[type];

      const squareIndexWhite = r * 8 + c;
      const squareIndexBlack = (7 - r) * 8 + c;

      if (isWhite) {
        whiteMaterial += val;
        whitePST += PST_MAP[type][squareIndexWhite] || 0;
        if (type === 'b') whiteBishops++;
      } else {
        blackMaterial += val;
        blackPST += PST_MAP[type][squareIndexBlack] || 0;
        if (type === 'b') blackBishops++;
      }
    }
  }

  // Bishop pair bonus
  let bishopBonus = 0;
  if (whiteBishops >= 2) bishopBonus += 30;
  if (blackBishops >= 2) bishopBonus -= 30;

  // Mobility estimation
  const currentTurn = chess.turn();
  const mobility = chess.moves().length * (currentTurn === 'w' ? 5 : -5);

  const totalScore = (whiteMaterial - blackMaterial) + (whitePST - blackPST) + bishopBonus + mobility;
  return totalScore;
}

/**
 * Calculates square influence & neural attention heatmap across all 64 squares.
 * Returns an object with:
 * - squareControl: 8x8 array with values from -1 (total Black dominance) to +1 (total White dominance)
 * - attackedSquares: list of squares currently under direct threat
 * - whiteControlCount, blackControlCount
 */
export function calculateNeuralHeatmap(chess) {
  const board = chess.board();
  const controlMatrix = Array(8).fill(0).map(() => Array(8).fill(0));
  const whiteControlled = Array(8).fill(0).map(() => Array(8).fill(0));
  const blackControlled = Array(8).fill(0).map(() => Array(8).fill(0));

  const attackedSquares = [];

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  // Temporary board clone to test attacks
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = `${files[c]}${8 - r}`;
      const piece = board[r][c];

      const whiteAttacks = chess.isAttacked(square, 'w');
      const blackAttacks = chess.isAttacked(square, 'b');

      if (whiteAttacks) whiteControlled[r][c] += 1;
      if (blackAttacks) blackControlled[r][c] += 1;

      // Net control calculation (-1 to +1 normalized)
      const diff = whiteControlled[r][c] - blackControlled[r][c];
      controlMatrix[r][c] = Math.max(-1, Math.min(1, diff * 0.4));

      // Check if current piece is under attack by opponent
      if (piece) {
        if (piece.color === 'w' && blackAttacks) {
          attackedSquares.push({ square, color: 'w', piece: piece.type });
        } else if (piece.color === 'b' && whiteAttacks) {
          attackedSquares.push({ square, color: 'b', piece: piece.type });
        }
      }
    }
  }

  return {
    controlMatrix,
    attackedSquares,
    whiteControlled,
    blackControlled
  };
}

/**
 * Convert centipawns to win percentage for visual representation
 */
export function centipawnsToWinProbability(cp) {
  // Sigmoid formula used in modern engines
  return 1 / (1 + Math.pow(10, -cp / 400));
}
