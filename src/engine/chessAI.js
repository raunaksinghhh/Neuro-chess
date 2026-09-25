// High-Performance Minimax Engine with Alpha-Beta Pruning, Quiescence Search, MVV-LVA, Transposition Table, and Multi-PV

import { Chess } from 'chess.js';
import { evaluateBoard, PIECE_VALUES } from './neuralEval';

// Transposition Cache
const transpositionTable = new Map();
const MAX_TT_ENTRIES = 50000;

// MVV-LVA Victim-Attacker Values
const MVV_LVA = {
  q: { p: 50, n: 40, b: 30, r: 20, q: 10, k: 0 },
  r: { p: 40, n: 30, b: 20, r: 10, q: 5,  k: 0 },
  b: { p: 30, n: 20, b: 10, r: 5,  q: 2,  k: 0 },
  n: { p: 30, n: 20, b: 10, r: 5,  q: 2,  k: 0 },
  p: { p: 10, n: 5,  b: 3,  r: 2,  q: 1,  k: 0 }
};

/**
 * Score moves for optimal move ordering (captures & checks first)
 */
function scoreMove(move, chess) {
  let score = 0;
  if (move.captured) {
    const victim = move.captured;
    const attacker = move.piece;
    score += (MVV_LVA[victim]?.[attacker] || 10) + (PIECE_VALUES[victim] || 0) * 10 - (PIECE_VALUES[attacker] || 0);
  }
  if (move.promotion) {
    score += 800;
  }
  if (move.san.includes('+')) {
    score += 50;
  }
  return score;
}

/**
 * Quiescence Search - explores capture sequences to prevent the horizon effect
 */
function quiescence(chess, alpha, beta, isMaximizing, qDepth = 0) {
  const standPat = evaluateBoard(chess);
  
  if (qDepth >= 4) {
    return standPat;
  }

  if (isMaximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  // Generate only capture moves
  const moves = chess.moves({ verbose: true }).filter(m => m.captured);
  moves.sort((a, b) => scoreMove(b, chess) - scoreMove(a, chess));

  for (const move of moves) {
    chess.move(move);
    const score = quiescence(chess, alpha, beta, !isMaximizing, qDepth + 1);
    chess.undo();

    if (isMaximizing) {
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    } else {
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
  }

  return isMaximizing ? alpha : beta;
}

let nodesEvaluated = 0;

/**
 * Minimax with Alpha-Beta Pruning and Transposition Table
 */
function minimax(chess, depth, alpha, beta, isMaximizing) {
  nodesEvaluated++;

  if (depth === 0 || chess.isGameOver()) {
    return quiescence(chess, alpha, beta, isMaximizing, 0);
  }

  const fen = chess.fen();
  const ttEntry = transpositionTable.get(fen);
  if (ttEntry && ttEntry.depth >= depth) {
    return ttEntry.score;
  }

  const moves = chess.moves({ verbose: true });
  moves.sort((a, b) => scoreMove(b, chess) - scoreMove(a, chess));

  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, alpha, beta, !isMaximizing);
    chess.undo();

    if (isMaximizing) {
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);
    } else {
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) {
      break; // Alpha-beta cutoff
    }
  }

  if (transpositionTable.size < MAX_TT_ENTRIES) {
    transpositionTable.set(fen, { score: bestScore, depth });
  }

  return bestScore;
}

/**
 * Finds best move and calculates candidate Multi-PV lines
 */
export async function getEngineAnalysis(chessInstance, depth = 3, multiPV = 3) {
  const startTime = performance.now();
  nodesEvaluated = 0;

  const fen = chessInstance.fen();
  const chess = new Chess(fen);
  const isMaximizing = chess.turn() === 'w';

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  moves.sort((a, b) => scoreMove(b, chess) - scoreMove(a, chess));

  const candidateMoves = [];

  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing);
    chess.undo();

    candidateMoves.push({
      move,
      san: move.san,
      from: move.from,
      to: move.to,
      score, // In centipawns
      displayScore: isMaximizing ? score : -score
    });
  }

  // Sort candidate moves by best score
  candidateMoves.sort((a, b) => {
    return isMaximizing ? b.score - a.score : a.score - b.score;
  });

  const durationMs = Math.max(1, performance.now() - startTime);
  const nps = Math.round((nodesEvaluated / durationMs) * 1000);

  const bestMove = candidateMoves[0];
  const topLines = candidateMoves.slice(0, multiPV);

  return {
    bestMove: bestMove ? { from: bestMove.from, to: bestMove.to, san: bestMove.san } : null,
    score: bestMove ? bestMove.score : 0,
    depth,
    nodes: nodesEvaluated,
    nps,
    timeMs: durationMs,
    lines: topLines
  };
}

/**
 * Compute move for AI player considering persona (depth, blunder chance, randomness)
 */
export async function getAIMove(chessInstance, persona) {
  const depth = persona.depth || 3;
  const analysis = await getEngineAnalysis(chessInstance, depth, 4);
  if (!analysis || !analysis.bestMove) return null;

  // Blunder injection for lower Elo personas
  if (Math.random() < (persona.blunderChance || 0) && analysis.lines.length > 1) {
    const blunderIdx = Math.min(analysis.lines.length - 1, Math.floor(Math.random() * 2) + 1);
    return analysis.lines[blunderIdx].move;
  }

  // Randomness perturbation
  if (persona.randomness > 0 && analysis.lines.length > 1) {
    const top2 = analysis.lines.slice(0, 2);
    if (Math.random() < persona.randomness) {
      return top2[1].move;
    }
  }

  return analysis.bestMove;
}

/**
 * Classify move accuracy for game review
 */
export function classifyMove(prevEval, currEval, isWhiteMove, isBestMove) {
  // Delta in terms of current player's perspective
  const delta = isWhiteMove ? (currEval - prevEval) : (prevEval - currEval);

  if (isBestMove && delta >= -10) {
    if (delta > 150) return { label: 'Brilliant', symbol: '!!', color: '#00f0ff', type: 'brilliant' };
    return { label: 'Best Move', symbol: '⭐', color: '#10b981', type: 'best' };
  }

  if (delta >= -25) return { label: 'Good', symbol: '✓', color: '#94a3b8', type: 'good' };
  if (delta >= -80) return { label: 'Inaccuracy', symbol: '?!', color: '#f59e0b', type: 'inaccuracy' };
  if (delta >= -200) return { label: 'Mistake', symbol: '?', color: '#f97316', type: 'mistake' };
  return { label: 'Blunder', symbol: '??', color: '#ef4444', type: 'blunder' };
}
