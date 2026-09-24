#include "search.hpp"
#include <algorithm>
#include <cstring>

namespace NeuroEngine {

static const int MVV_LVA_VALUES[7] = { 0, 100, 320, 330, 500, 900, 20000 };

Searcher::Searcher() {
    tt.resize(TT_SIZE);
    clear_tt();
}

void Searcher::clear_tt() {
    std::fill(tt.begin(), tt.end(), TTEntry{});
    std::memset(killer_moves, 0, sizeof(killer_moves));
    std::memset(history_table, 0, sizeof(history_table));
}

int Searcher::score_move(const Move& m, const Position& pos, const Move& tt_move, int ply) {
    if (!tt_move.is_none() && m == tt_move) return 100000;

    int score = 0;
    if (m.captured != EMPTY) {
        PieceType victim = piece_type(m.captured);
        Piece moving = pos.board[m.from];
        PieceType attacker = piece_type(moving);
        score = 10000 + (MVV_LVA_VALUES[victim] * 10) - MVV_LVA_VALUES[attacker];
    } else {
        if (ply < 64) {
            if (killer_moves[ply][0] == m) score = 9000;
            else if (killer_moves[ply][1] == m) score = 8000;
        }
        Piece moving = pos.board[m.from];
        score += history_table[moving][m.to];
    }

    if (m.promotion != NO_PIECE_TYPE) score += 9500;
    return score;
}

int Searcher::quiescence(Position& pos, int alpha, int beta, bool is_maximizing, int q_depth) {
    nodes++;
    int stand_pat = Evaluator::evaluate(pos);

    if (q_depth >= 4) return stand_pat;

    if (is_maximizing) {
        if (stand_pat >= beta) return beta;
        if (stand_pat > alpha) alpha = stand_pat;
    } else {
        if (stand_pat <= alpha) return alpha;
        if (stand_pat < beta) beta = stand_pat;
    }

    std::vector<Move> moves;
    pos.generate_pseudo_legal_moves(moves, true); // only captures

    // Sort captures
    std::vector<std::pair<int, Move>> scored_moves;
    for (const auto& m : moves) {
        scored_moves.emplace_back(score_move(m, pos, Move(), 0), m);
    }
    std::sort(scored_moves.begin(), scored_moves.end(), [](const auto& a, const auto& b) {
        return a.first > b.first;
    });

    for (const auto& sm : scored_moves) {
        if (!pos.make_move(sm.second)) continue;

        int score = quiescence(pos, alpha, beta, !is_maximizing, q_depth + 1);
        pos.undo_move();

        if (is_maximizing) {
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        } else {
            if (score <= alpha) return alpha;
            if (score < beta) beta = score;
        }
    }

    return is_maximizing ? alpha : beta;
}

int Searcher::minimax(Position& pos, int depth, int ply, int alpha, int beta, bool is_maximizing) {
    nodes++;

    if (depth <= 0) {
        return quiescence(pos, alpha, beta, is_maximizing, 0);
    }

    uint64_t key = pos.hash;
    TTEntry& entry = tt[key % TT_SIZE];
    Move tt_move;

    if (entry.hash == key && entry.depth >= depth) {
        if (entry.flag == TT_EXACT) return entry.score;
        if (entry.flag == TT_LOWERBOUND && entry.score >= beta) return entry.score;
        if (entry.flag == TT_UPPERBOUND && entry.score <= alpha) return entry.score;
        tt_move = entry.best_move;
    }

    std::vector<Move> legal_moves;
    pos.generate_legal_moves(legal_moves);

    if (legal_moves.empty()) {
        if (pos.is_in_check(pos.side_to_move)) {
            // Checkmate
            return is_maximizing ? (-99999 + ply) : (99999 - ply);
        }
        // Stalemate
        return 0;
    }

    // Move ordering
    std::vector<std::pair<int, Move>> scored_moves;
    for (const auto& m : legal_moves) {
        scored_moves.emplace_back(score_move(m, pos, tt_move, ply), m);
    }
    std::sort(scored_moves.begin(), scored_moves.end(), [](const auto& a, const auto& b) {
        return a.first > b.first;
    });

    int best_score = is_maximizing ? -1000000 : 1000000;
    Move best_move;
    int alpha_orig = alpha;

    for (const auto& sm : scored_moves) {
        const Move& m = sm.second;
        if (!pos.make_move(m)) continue;

        int score = minimax(pos, depth - 1, ply + 1, alpha, beta, !is_maximizing);
        pos.undo_move();

        if (is_maximizing) {
            if (score > best_score) {
                best_score = score;
                best_move = m;
            }
            alpha = std::max(alpha, best_score);
        } else {
            if (score < best_score) {
                best_score = score;
                best_move = m;
            }
            beta = std::min(beta, best_score);
        }

        if (beta <= alpha) {
            // Alpha-Beta cutoff (Beta cutoff)
            if (m.captured == EMPTY && ply < 64) {
                killer_moves[ply][1] = killer_moves[ply][0];
                killer_moves[ply][0] = m;
                Piece moving = pos.board[m.from];
                history_table[moving][m.to] += depth * depth;
            }
            break;
        }
    }

    // Save to Transposition Table
    entry.hash = key;
    entry.score = best_score;
    entry.depth = depth;
    entry.best_move = best_move;

    if (best_score <= alpha_orig) entry.flag = TT_UPPERBOUND;
    else if (best_score >= beta) entry.flag = TT_LOWERBOUND;
    else entry.flag = TT_EXACT;

    return best_score;
}

SearchResult Searcher::search(Position& pos, int depth, int multi_pv) {
    auto start_time = std::chrono::high_resolution_clock::now();
    nodes = 0;

    std::vector<Move> legal_moves;
    pos.generate_legal_moves(legal_moves);

    SearchResult res;
    res.depth = depth;

    if (legal_moves.empty()) {
        res.score = pos.is_in_check(pos.side_to_move) ? -99999 : 0;
        return res;
    }

    bool is_maximizing = (pos.side_to_move == WHITE);

    std::vector<SearchLine> scored_lines;

    for (const auto& m : legal_moves) {
        if (!pos.make_move(m)) continue;

        int score = minimax(pos, depth - 1, 1, -1000000, 1000000, !is_maximizing);
        pos.undo_move();

        SearchLine line;
        line.move = m;
        line.uci = m.to_uci();
        line.score = score;
        line.depth = depth;
        scored_lines.push_back(line);
    }

    std::sort(scored_lines.begin(), scored_lines.end(), [is_maximizing](const auto& a, const auto& b) {
        return is_maximizing ? a.score > b.score : a.score < b.score;
    });

    auto end_time = std::chrono::high_resolution_clock::now();
    auto elapsed_ms = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time).count();
    res.time_ms = std::max(1, static_cast<int>(elapsed_ms));
    res.nodes = nodes;
    res.nps = (nodes * 1000) / res.time_ms;

    if (!scored_lines.empty()) {
        res.best_move = scored_lines[0].move;
        res.score = scored_lines[0].score;

        int count = std::min(multi_pv, static_cast<int>(scored_lines.size()));
        for (int i = 0; i < count; ++i) {
            res.lines.push_back(scored_lines[i]);
        }
    }

    return res;
}

} // namespace NeuroEngine
