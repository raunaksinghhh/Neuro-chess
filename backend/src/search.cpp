#include "search.hpp"
#include <algorithm>
#include <cstring>

namespace NeuroEngine {

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
static const int MVV_LVA_VALUES[7] = { 0, 100, 320, 330, 500, 900, 20000 };

// LMR reduction table: reduction[depth][move_index]
static int LMR_REDUCTION[32][64];

static void init_lmr_table() {
    for (int d = 0; d < 32; ++d)
        for (int m = 0; m < 64; ++m)
            // Standard LMR formula: ln(depth) * ln(move_index) / 2.0
            LMR_REDUCTION[d][m] = (d > 0 && m > 0)
                ? static_cast<int>(0.75 + 0.4 * __builtin_log(d) * __builtin_log(m))
                : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Searcher init
// ─────────────────────────────────────────────────────────────────────────────
Searcher::Searcher() {
    tt.resize(TT_SIZE);
    clear_tt();
    init_lmr_table();
}

void Searcher::clear_tt() {
    std::fill(tt.begin(), tt.end(), TTEntry{});
    std::memset(killer_moves,  0, sizeof(killer_moves));
    std::memset(history_table, 0, sizeof(history_table));
}

// ─────────────────────────────────────────────────────────────────────────────
//  Move scoring  (Layer 4 — move ordering)
// ─────────────────────────────────────────────────────────────────────────────
int Searcher::score_move(const Move& m, const Position& pos, const Move& tt_move, int ply) {
    if (!tt_move.is_none() && m == tt_move) return 1'000'000;

    int score = 0;
    if (m.captured != EMPTY) {
        PieceType victim   = piece_type(m.captured);
        PieceType attacker = piece_type(pos.board[m.from]);
        score = 100'000 + (MVV_LVA_VALUES[victim] * 10) - MVV_LVA_VALUES[attacker];
    } else {
        if (ply < 64) {
            if (killer_moves[ply][0] == m) score = 90'000;
            else if (killer_moves[ply][1] == m) score = 80'000;
        }
        Piece moving = pos.board[m.from];
        score += history_table[moving][m.to];
    }
    if (m.promotion != NO_PIECE_TYPE) score += 95'000;
    return score;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layer 6 helpers — Null Move (make/undo without the full move stack)
// ─────────────────────────────────────────────────────────────────────────────
void Searcher::apply_null_move(Position& pos, int8_t& saved_ep, uint64_t& saved_hash) {
    saved_ep   = pos.ep_square;
    saved_hash = pos.hash;
    pos.ep_square    = -1;
    pos.side_to_move = (pos.side_to_move == WHITE) ? BLACK : WHITE;
    pos.hash         = pos.calculate_hash();
}

void Searcher::undo_null_move(Position& pos, int8_t saved_ep, uint64_t saved_hash) {
    pos.side_to_move = (pos.side_to_move == WHITE) ? BLACK : WHITE;
    pos.ep_square    = saved_ep;
    pos.hash         = saved_hash;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layer 3 — Quiescence Search
// ─────────────────────────────────────────────────────────────────────────────
int Searcher::quiescence(Position& pos, int alpha, int beta, bool is_maximizing, int q_depth) {
    ++nodes;
    int stand_pat = Evaluator::evaluate(pos);
    if (q_depth >= 5) return stand_pat;

    if (is_maximizing) {
        if (stand_pat >= beta) return beta;
        alpha = std::max(alpha, stand_pat);
    } else {
        if (stand_pat <= alpha) return alpha;
        beta = std::min(beta, stand_pat);
    }

    // Delta pruning: if even the best capture can't raise alpha, bail out
    const int DELTA_MARGIN = 975; // queen value ~ 900
    if (is_maximizing && stand_pat + DELTA_MARGIN < alpha) return alpha;
    if (!is_maximizing && stand_pat - DELTA_MARGIN > beta)  return beta;

    std::vector<Move> moves;
    pos.generate_pseudo_legal_moves(moves, /*captures_only=*/true);

    // Sort captures with MVV-LVA
    std::sort(moves.begin(), moves.end(), [&](const Move& a, const Move& b) {
        int sa = (a.captured != EMPTY)
            ? (MVV_LVA_VALUES[piece_type(a.captured)] * 10 - MVV_LVA_VALUES[piece_type(pos.board[a.from])]) : 0;
        int sb = (b.captured != EMPTY)
            ? (MVV_LVA_VALUES[piece_type(b.captured)] * 10 - MVV_LVA_VALUES[piece_type(pos.board[b.from])]) : 0;
        return sa > sb;
    });

    for (const Move& m : moves) {
        if (!pos.make_move(m)) continue;
        int score = quiescence(pos, alpha, beta, !is_maximizing, q_depth + 1);
        pos.undo_move();

        if (is_maximizing) {
            if (score >= beta) return beta;
            alpha = std::max(alpha, score);
        } else {
            if (score <= alpha) return alpha;
            beta = std::min(beta, score);
        }
    }
    return is_maximizing ? alpha : beta;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layers 1+2+5+6 — Minimax with Alpha-Beta, TT, Null Move Pruning, LMR
// ─────────────────────────────────────────────────────────────────────────────
int Searcher::minimax(Position& pos, int depth, int ply, int alpha, int beta, bool is_maximizing) {
    ++nodes;

    const bool in_check = pos.is_in_check(pos.side_to_move);

    // Check extension — don't drop into Q-search while in check
    if (in_check) ++depth;

    if (depth <= 0)
        return quiescence(pos, alpha, beta, is_maximizing, 0);

    // ── Layer 5: Transposition Table lookup ────────────────────────────────
    uint64_t key  = pos.hash;
    TTEntry& entry = tt[key % TT_SIZE];
    Move tt_move;

    if (entry.hash == key && entry.depth >= depth) {
        if      (entry.flag == TT_EXACT)      return entry.score;
        else if (entry.flag == TT_LOWERBOUND) alpha = std::max(alpha, entry.score);
        else if (entry.flag == TT_UPPERBOUND) beta  = std::min(beta,  entry.score);
        if (alpha >= beta) return entry.score;
        tt_move = entry.best_move;
    }

    // ── Layer 6a: Null Move Pruning ────────────────────────────────────────
    // Condition: not in check, not near endgame, depth >= 3
    bool is_endgame = (popcount(pos.all) <= 12);
    if (!in_check && !is_endgame && depth >= 3) {
        int R = (depth >= 6) ? 3 : 2;   // adaptive reduction
        int8_t  saved_ep;
        uint64_t saved_hash;
        apply_null_move(pos, saved_ep, saved_hash);

        int null_score = minimax(pos, depth - R - 1, ply + 1,
                                 alpha, beta, !is_maximizing);
        undo_null_move(pos, saved_ep, saved_hash);

        // If even giving a free move to the opponent doesn't help them, prune
        if (is_maximizing && null_score >= beta) return beta;
        if (!is_maximizing && null_score <= alpha) return alpha;
    }

    // ── Generate and order legal moves ────────────────────────────────────
    std::vector<Move> legal_moves;
    pos.generate_legal_moves(legal_moves);

    if (legal_moves.empty()) {
        if (in_check)
            return is_maximizing ? (-99'999 + ply) : (99'999 - ply); // checkmate
        return 0; // stalemate
    }

    // ── Layer 4: Move ordering ─────────────────────────────────────────────
    std::vector<std::pair<int,Move>> scored;
    scored.reserve(legal_moves.size());
    for (const Move& m : legal_moves)
        scored.emplace_back(score_move(m, pos, tt_move, ply), m);
    std::sort(scored.begin(), scored.end(),
              [](const auto& a, const auto& b){ return a.first > b.first; });

    int  best_score = is_maximizing ? -1'000'000 : 1'000'000;
    Move best_move;
    int  alpha_orig = alpha;
    int  move_idx   = 0;

    for (const auto& [ms, m] : scored) {
        if (!pos.make_move(m)) { ++move_idx; continue; }

        int score;

        // ── Layer 6b: Late Move Reductions (LMR) ──────────────────────────
        bool is_quiet    = (m.captured == EMPTY && m.flag != FLAG_PROMOTION);
        bool can_do_lmr  = (move_idx >= 3 && depth >= 3 && is_quiet && !in_check);

        if (can_do_lmr) {
            int R         = std::max(1, LMR_REDUCTION[std::min(depth, 31)][std::min(move_idx, 63)]);
            int red_depth = depth - 1 - R;

            // Search at reduced depth first
            score = minimax(pos, red_depth, ply + 1, alpha, beta, !is_maximizing);

            // If it looks interesting, re-search at full depth
            bool re_search = (is_maximizing  && score > alpha)
                          || (!is_maximizing && score < beta);
            if (re_search)
                score = minimax(pos, depth - 1, ply + 1, alpha, beta, !is_maximizing);
        } else {
            score = minimax(pos, depth - 1, ply + 1, alpha, beta, !is_maximizing);
        }

        pos.undo_move();
        ++move_idx;

        if (is_maximizing) {
            if (score > best_score) { best_score = score; best_move = m; }
            alpha = std::max(alpha, best_score);
        } else {
            if (score < best_score) { best_score = score; best_move = m; }
            beta = std::min(beta, best_score);
        }

        if (beta <= alpha) {
            // ── Layer 4: Killer & History update on β-cutoff ────────────
            if (m.captured == EMPTY && ply < 64) {
                killer_moves[ply][1] = killer_moves[ply][0];
                killer_moves[ply][0] = m;
                Piece moving = pos.board[m.from];
                history_table[moving][m.to] += depth * depth;
            }
            break;
        }
    }

    // ── Layer 5: Store in Transposition Table ──────────────────────────────
    entry.hash       = key;
    entry.score      = best_score;
    entry.depth      = depth;
    entry.best_move  = best_move;

    if      (best_score <= alpha_orig) entry.flag = TT_UPPERBOUND;
    else if (best_score >= beta)       entry.flag = TT_LOWERBOUND;
    else                               entry.flag = TT_EXACT;

    return best_score;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layer 6c — Iterative Deepening  (wraps minimax, improves TT hit rate)
// ─────────────────────────────────────────────────────────────────────────────
SearchResult Searcher::search(Position& pos, int max_depth, int multi_pv) {
    auto t0 = std::chrono::high_resolution_clock::now();
    nodes = 0;

    bool is_maximizing = (pos.side_to_move == WHITE);
    SearchResult final_res;
    final_res.depth = max_depth;

    std::vector<Move> legal_moves;
    pos.generate_legal_moves(legal_moves);
    if (legal_moves.empty()) {
        final_res.score = pos.is_in_check(pos.side_to_move) ? -99'999 : 0;
        return final_res;
    }

    // ── Iterative deepening: search depth 1 → max_depth ───────────────────
    for (int d = 1; d <= max_depth; ++d) {
        std::vector<std::pair<int,Move>> scored;
        scored.reserve(legal_moves.size());

        for (const Move& m : legal_moves) {
            if (!pos.make_move(m)) continue;
            int score = minimax(pos, d - 1, 1, -1'000'000, 1'000'000, !is_maximizing);
            pos.undo_move();
            scored.emplace_back(score, m);
        }

        std::sort(scored.begin(), scored.end(),
                  [is_maximizing](const auto& a, const auto& b){
                      return is_maximizing ? a.first > b.first : a.first < b.first;
                  });

        if (scored.empty()) continue;

        // Update result with this iteration
        final_res.best_move = scored[0].second;
        final_res.score     = scored[0].first;
        final_res.lines.clear();

        int count = std::min(multi_pv, static_cast<int>(scored.size()));
        for (int i = 0; i < count; ++i) {
            SearchLine line;
            line.move  = scored[i].second;
            line.uci   = scored[i].second.to_uci();
            line.score = scored[i].first;
            line.depth = d;
            final_res.lines.push_back(line);
        }
    }

    auto t1  = std::chrono::high_resolution_clock::now();
    int  ms  = std::max(1, static_cast<int>(
                   std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count()));

    final_res.nodes   = nodes;
    final_res.time_ms = ms;
    final_res.nps     = (nodes * 1000ULL) / static_cast<uint64_t>(ms);
    return final_res;
}

} // namespace NeuroEngine
