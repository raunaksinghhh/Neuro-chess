#include "evaluation.hpp"
#include <algorithm>
#include <cmath>

namespace NeuroEngine {

static const int PIECE_VALUES[7] = { 0, 100, 320, 330, 500, 900, 20000 };

static const int PAWN_PST[64] = {
     0,   0,   0,   0,   0,   0,   0,   0,
    50,  50,  50,  50,  50,  50,  50,  50,
    10,  10,  20,  30,  30,  20,  10,  10,
     5,   5,  10,  25,  25,  10,   5,   5,
     0,   0,   0,  20,  20,   0,   0,   0,
     5,  -5, -10,   0,   0, -10,  -5,   5,
     5,  10,  10, -20, -20,  10,  10,   5,
     0,   0,   0,   0,   0,   0,   0,   0
};

static const int KNIGHT_PST[64] = {
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,   0,   0,   0,   0, -20, -40,
    -30,   0,  10,  15,  15,  10,   0, -30,
    -30,   5,  15,  20,  20,  15,   5, -30,
    -30,   0,  15,  20,  20,  15,   0, -30,
    -30,   5,  10,  15,  15,  10,   5, -30,
    -40, -20,   0,   5,   5,   0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
};

static const int BISHOP_PST[64] = {
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,  10,  10,   5,   0, -10,
    -10,   5,   5,  10,  10,   5,   5, -10,
    -10,   0,  10,  10,  10,  10,   0, -10,
    -10,  10,  10,  10,  10,  10,  10, -10,
    -10,   5,   0,   0,   0,   0,   5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
};

static const int ROOK_PST[64] = {
      0,   0,   0,   0,   0,   0,   0,   0,
      5,  10,  10,  10,  10,  10,  10,   5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
      0,   0,   0,   5,   5,   0,   0,   0
};

static const int QUEEN_PST[64] = {
    -20, -10, -10,  -5,  -5, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,   5,   5,   5,   0, -10,
     -5,   0,   5,   5,   5,   5,   0,  -5,
      0,   0,   5,   5,   5,   5,   0,  -5,
    -10,   5,   5,   5,   5,   5,   0, -10,
    -10,   0,   5,   0,   0,   0,   0, -10,
    -20, -10, -10,  -5,  -5, -10, -10, -20
};

static const int KING_PST[64] = {
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
     20,  20,   0,   0,   0,   0,  20,  20,
     20,  30,  10,   0,   0,  10,  30,  20
};

static inline const int* get_pst(PieceType pt) {
    switch (pt) {
        case PAWN:   return PAWN_PST;
        case KNIGHT: return KNIGHT_PST;
        case BISHOP: return BISHOP_PST;
        case ROOK:   return ROOK_PST;
        case QUEEN:  return QUEEN_PST;
        case KING:   return KING_PST;
        default:     return nullptr;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  evaluate() — uses bitboard iteration (pop_lsb) instead of 64-square loop
// ─────────────────────────────────────────────────────────────────────────────
int Evaluator::evaluate(const Position& pos) {
    int score = 0;
    int white_bishops = 0, black_bishops = 0;
    int white_pawn_files[8] = {}, black_pawn_files[8] = {};

    static const PieceType ALL_TYPES[] = { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING };

    for (PieceType pt : ALL_TYPES) {
        const int* pst = get_pst(pt);
        const int  val = PIECE_VALUES[pt];

        // White — iterate occupied squares via bitboard pop_lsb
        Bitboard wb = pos.bb[WHITE][pt];
        while (wb) {
            int sq = pop_lsb(wb);
            score += val;
            if (pst) score += pst[sq];
            if (pt == BISHOP) ++white_bishops;
            if (pt == PAWN)   ++white_pawn_files[sq & 7];
        }

        // Black — mirror square index for PST symmetry
        Bitboard bl = pos.bb[BLACK][pt];
        while (bl) {
            int sq = pop_lsb(bl);
            score -= val;
            if (pst) score -= pst[(7 - (sq >> 3)) * 8 + (sq & 7)];
            if (pt == BISHOP) ++black_bishops;
            if (pt == PAWN)   ++black_pawn_files[sq & 7];
        }
    }

    // Bishop pair bonus
    if (white_bishops >= 2) score += 30;
    if (black_bishops >= 2) score -= 30;

    // Doubled pawn penalty
    for (int f = 0; f < 8; ++f) {
        if (white_pawn_files[f] > 1) score -= (white_pawn_files[f] - 1) * 20;
        if (black_pawn_files[f] > 1) score += (black_pawn_files[f] - 1) * 20;
    }

    return score;
}

// ─────────────────────────────────────────────────────────────────────────────
//  evaluate_detailed() — heatmap + attacked squares
// ─────────────────────────────────────────────────────────────────────────────
EvalResult Evaluator::evaluate_detailed(const Position& pos) {
    EvalResult res;
    res.score = evaluate(pos);
    res.heatmap.resize(8, std::vector<float>(8, 0.0f));

    for (int r = 0; r < 8; ++r) {
        for (int c = 0; c < 8; ++c) {
            int sq = r * 8 + c;
            bool wa = pos.is_attacked(sq, WHITE);
            bool ba = pos.is_attacked(sq, BLACK);

            float diff = 0.0f;
            if (wa && !ba)       diff =  0.6f;
            else if (!wa && ba)  diff = -0.6f;
            else if (wa && ba)   diff =  0.1f;
            res.heatmap[7 - r][c] = diff;

            Piece p = pos.board[sq];
            if (p != EMPTY) {
                if (piece_color(p) == WHITE && ba) res.attacked_squares.push_back(square_to_str(sq));
                if (piece_color(p) == BLACK && wa) res.attacked_squares.push_back(square_to_str(sq));
            }
        }
    }
    return res;
}

} // namespace NeuroEngine
