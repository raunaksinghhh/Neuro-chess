// chess.worker.js — Runs minimax search on a dedicated background thread
// Imported via Vite's ?worker syntax: import ChessWorker from './chess.worker.js?worker'

import { Chess } from 'chess.js';

// ── Piece Values ──────────────────────────────────────────────────────────────
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// ── MVV-LVA ───────────────────────────────────────────────────────────────────
const MVV_LVA = {
  q: { p: 50, n: 40, b: 30, r: 20, q: 10, k: 0 },
  r: { p: 40, n: 30, b: 20, r: 10, q: 5,  k: 0 },
  b: { p: 30, n: 20, b: 10, r: 5,  q: 2,  k: 0 },
  n: { p: 30, n: 20, b: 10, r: 5,  q: 2,  k: 0 },
  p: { p: 10, n: 5,  b: 3,  r: 2,  q: 1,  k: 0 }
};

// ── Piece-Square Tables ───────────────────────────────────────────────────────
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
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];
const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];
const ROOK_PST = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];
const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];
const KING_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];
const PST_MAP = { p: PAWN_PST, n: KNIGHT_PST, b: BISHOP_PST, r: ROOK_PST, q: QUEEN_PST, k: KING_PST };

// ── Evaluation ────────────────────────────────────────────────────────────────
function evaluateBoard(chess) {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? -99999 : 99999;
  if (chess.isDraw() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) return 0;

  let score = 0;
  let whiteBishops = 0, blackBishops = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const isWhite = piece.color === 'w';
      const val = PIECE_VALUES[piece.type];
      const idx = isWhite ? r * 8 + c : (7 - r) * 8 + c;
      const pst = PST_MAP[piece.type][idx] || 0;
      if (isWhite) { score += val + pst; if (piece.type === 'b') whiteBishops++; }
      else         { score -= val + pst; if (piece.type === 'b') blackBishops++; }
    }
  }

  if (whiteBishops >= 2) score += 30;
  if (blackBishops >= 2) score -= 30;

  const mobility = chess.moves().length * (chess.turn() === 'w' ? 5 : -5);
  return score + mobility;
}

function scoreMove(move) {
  let s = 0;
  if (move.captured) {
    s += (MVV_LVA[move.captured]?.[move.piece] || 10) + (PIECE_VALUES[move.captured] || 0) * 10 - (PIECE_VALUES[move.piece] || 0);
  }
  if (move.promotion) s += 800;
  if (move.san.includes('+')) s += 50;
  return s;
}

// ── Transposition Table ───────────────────────────────────────────────────────
const tt = new Map();
const MAX_TT = 60000;

// ── Quiescence Search ─────────────────────────────────────────────────────────
function quiescence(chess, alpha, beta, isMax, qd = 0) {
  const sp = evaluateBoard(chess);
  if (qd >= 4) return sp;

  if (isMax) {
    if (sp >= beta) return beta;
    if (sp > alpha) alpha = sp;
  } else {
    if (sp <= alpha) return alpha;
    if (sp < beta) beta = sp;
  }

  const caps = chess.moves({ verbose: true }).filter(m => m.captured);
  caps.sort((a, b) => scoreMove(b) - scoreMove(a));

  for (const m of caps) {
    chess.move(m);
    const sc = quiescence(chess, alpha, beta, !isMax, qd + 1);
    chess.undo();
    if (isMax) {
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    } else {
      if (sc <= alpha) return alpha;
      if (sc < beta) beta = sc;
    }
  }
  return isMax ? alpha : beta;
}

// ── Minimax + Alpha-Beta ──────────────────────────────────────────────────────
function minimax(chess, depth, alpha, beta, isMax) {
  if (depth === 0 || chess.isGameOver()) return quiescence(chess, alpha, beta, isMax);

  const key = chess.fen() + depth;
  const cached = tt.get(key);
  if (cached !== undefined) return cached;

  const moves = chess.moves({ verbose: true });
  moves.sort((a, b) => scoreMove(b) - scoreMove(a));

  // Prune: only search top 20 at depth >= 3
  const candidates = depth >= 3 ? moves.slice(0, 20) : moves;

  let best = isMax ? -Infinity : Infinity;

  for (const m of candidates) {
    chess.move(m);
    const sc = minimax(chess, depth - 1, alpha, beta, !isMax);
    chess.undo();
    if (isMax) {
      if (sc > best) best = sc;
      if (sc > alpha) alpha = sc;
    } else {
      if (sc < best) best = sc;
      if (sc < beta) beta = sc;
    }
    if (beta <= alpha) break;
  }

  if (tt.size < MAX_TT) tt.set(key, best);
  return best;
}

// ── Worker Message Handler ─────────────────────────────────────────────────────
self.onmessage = function (e) {
  const { fen, depth, multiPV = 3, persona } = e.data;

  tt.clear(); // Fresh TT per search to avoid memory bloat

  const chess = new Chess(fen);
  const isMax = chess.turn() === 'w';

  const moves = chess.moves({ verbose: true });
  if (!moves.length) {
    self.postMessage({ bestMove: null, score: 0, lines: [], nodes: 0, nps: 0, depth });
    return;
  }

  moves.sort((a, b) => scoreMove(b) - scoreMove(a));

  // Cap depth for JS worker — C++ backend handles deeper searches
  const searchDepth = Math.min(depth, 3);
  const maxCandidates = searchDepth >= 3 ? 20 : moves.length;
  const searchMoves = moves.slice(0, maxCandidates);

  const t0 = Date.now();
  let nodes = 0;
  const candidates = [];

  for (const m of searchMoves) {
    chess.move(m);
    const score = minimax(chess, searchDepth - 1, -Infinity, Infinity, !isMax);
    chess.undo();
    nodes++;
    candidates.push({ from: m.from, to: m.to, san: m.san, score, displayScore: isMax ? score : -score, move: m });
  }

  candidates.sort((a, b) => isMax ? b.score - a.score : a.score - b.score);

  const ms = Math.max(1, Date.now() - t0);
  const best = candidates[0];

  // Apply persona blunder / randomness
  let result = best;
  const blunderChance = persona?.blunderChance || 0;
  const randomness = persona?.randomness || 0;
  if (Math.random() < blunderChance && candidates.length > 1) {
    result = candidates[Math.min(candidates.length - 1, Math.floor(Math.random() * 2) + 1)];
  } else if (randomness > 0 && candidates.length > 1 && Math.random() < randomness) {
    result = candidates[1];
  }

  self.postMessage({
    bestMove: result ? { from: result.from, to: result.to, san: result.san } : null,
    score: best?.score || 0,
    lines: candidates.slice(0, multiPV),
    nodes,
    nps: Math.round((nodes / ms) * 1000),
    depth: searchDepth,
    timeMs: ms
  });
};
