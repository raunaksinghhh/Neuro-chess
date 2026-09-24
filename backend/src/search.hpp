#pragma once
#include "position.hpp"
#include "evaluation.hpp"
#include <chrono>

namespace NeuroEngine {

struct SearchLine {
    Move move;
    std::string uci;
    int score = 0;
    int depth = 0;
};

struct SearchResult {
    Move     best_move;
    int      score    = 0;
    int      depth    = 0;
    uint64_t nodes    = 0;
    uint64_t nps      = 0;
    int      time_ms  = 0;
    std::vector<SearchLine> lines;
};

enum TTFlag : uint8_t {
    TT_EXACT      = 0,
    TT_LOWERBOUND = 1,
    TT_UPPERBOUND = 2
};

struct TTEntry {
    uint64_t hash  = 0;
    int      score = 0;
    int      depth = 0;
    TTFlag   flag  = TT_EXACT;
    Move     best_move;
};

class Searcher {
private:
    static const int TT_SIZE = 1 << 20; // 1M entries
    std::vector<TTEntry> tt;
    uint64_t nodes = 0;

    Move killer_moves[64][2];
    int  history_table[13][64];

    // ── Layer 1: Minimax  (core recursion)
    // ── Layer 2: Alpha-Beta pruning        (inside minimax)
    // ── Layer 3: Quiescence search         (called at depth 0)
    // ── Layer 4: Move ordering             (score_move)
    // ── Layer 5: Transposition table       (inside minimax)
    // ── Layer 6: Null Move Pruning + LMR   (inside minimax)

    int  score_move(const Move& m, const Position& pos, const Move& tt_move, int ply);
    int  quiescence(Position& pos, int alpha, int beta, bool is_maximizing, int q_depth);
    int  minimax   (Position& pos, int depth, int ply, int alpha, int beta, bool is_maximizing);

    // Null-move helpers (inline; no make_move overhead)
    static void apply_null_move (Position& pos, int8_t& saved_ep, uint64_t& saved_hash);
    static void undo_null_move  (Position& pos, int8_t   saved_ep, uint64_t  saved_hash);

public:
    Searcher();
    void clear_tt();

    // Iterative deepening wrapper (Layer 6c)
    SearchResult search(Position& pos, int max_depth = 4, int multi_pv = 3);
};

} // namespace NeuroEngine
