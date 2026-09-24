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
        case PAWN: return PAWN_PST;
        case KNIGHT: return KNIGHT_PST;
        case BISHOP: return BISHOP_PST;
        case ROOK: return ROOK_PST;
        case QUEEN: return QUEEN_PST;
        case KING: return KING_PST;
        default: return nullptr;
    }
}

int Evaluator::evaluate(const Position& pos) {
    int white_material = 0, black_material = 0;
    int white_pst = 0, black_pst = 0;
    int white_bishops = 0, black_bishops = 0;

    int white_pawn_files[8] = {0};
    int black_pawn_files[8] = {0};

    for (int sq = 0; sq < 64; ++sq) {
        Piece p = pos.board[sq];
        if (p == EMPTY) continue;

        PieceType pt = piece_type(p);
        Color c = piece_color(p);
        int val = PIECE_VALUES[pt];
        const int* pst = get_pst(pt);

        int rank = sq / 8;
        int file = sq % 8;

        if (c == WHITE) {
            white_material += val;
            if (pst) white_pst += pst[sq];
            if (pt == BISHOP) white_bishops++;
            if (pt == PAWN) white_pawn_files[file]++;
        } else {
            black_material += val;
            // Mirror for Black
            int mirrored_sq = (7 - rank) * 8 + file;
            if (pst) black_pst += pst[mirrored_sq];
            if (pt == BISHOP) black_bishops++;
            if (pt == PAWN) black_pawn_files[file]++;
        }
    }

    int score = (white_material - black_material) + (white_pst - black_pst);

    // Bishop Pair Bonus
    if (white_bishops >= 2) score += 30;
    if (black_bishops >= 2) score -= 30;

    // Pawn Structure penalties (doubled pawns)
    for (int f = 0; f < 8; ++f) {
        if (white_pawn_files[f] > 1) score -= (white_pawn_files[f] - 1) * 20;
        if (black_pawn_files[f] > 1) score += (black_pawn_files[f] - 1) * 20;
    }

    return score;
}

EvalResult Evaluator::evaluate_detailed(const Position& pos) {
    EvalResult res;
    res.score = evaluate(pos);
    res.heatmap.resize(8, std::vector<float>(8, 0.0f));

    for (int r = 0; r < 8; ++r) {
        for (int c = 0; c < 8; ++c) {
            int8_t sq = r * 8 + c;
            bool white_atk = pos.is_attacked(sq, WHITE);
            bool black_atk = pos.is_attacked(sq, BLACK);

            float diff = 0.0f;
            if (white_atk && !black_atk) diff = 0.6f;
            else if (!white_atk && black_atk) diff = -0.6f;
            else if (white_atk && black_atk) diff = 0.1f;

            res.heatmap[7 - r][c] = diff;

            Piece p = pos.board[sq];
            if (p != EMPTY) {
                if (piece_color(p) == WHITE && black_atk) {
                    res.attacked_squares.push_back(square_to_str(sq));
                } else if (piece_color(p) == BLACK && white_atk) {
                    res.attacked_squares.push_back(square_to_str(sq));
                }
            }
        }
    }

    return res;
}

} // namespace NeuroEngine
