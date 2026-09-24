#pragma once
#include <cstdint>
#include <string>
#include <vector>
#include <iostream>

namespace NeuroEngine {

enum Color : uint8_t {
    WHITE = 0,
    BLACK = 1,
    NO_COLOR = 2
};

enum PieceType : uint8_t {
    NO_PIECE_TYPE = 0,
    PAWN = 1,
    KNIGHT = 2,
    BISHOP = 3,
    ROOK = 4,
    QUEEN = 5,
    KING = 6
};

enum Piece : uint8_t {
    EMPTY = 0,
    W_PAWN = 1, W_KNIGHT = 2, W_BISHOP = 3, W_ROOK = 4, W_QUEEN = 5, W_KING = 6,
    B_PAWN = 7, B_KNIGHT = 8, B_BISHOP = 9, B_ROOK = 10, B_QUEEN = 11, B_KING = 12
};

enum Square : int8_t {
    SQ_NONE = -1,
    A1 = 0,  B1, C1, D1, E1, F1, G1, H1,
    A2 = 8,  B2, C2, D2, E2, F2, G2, H2,
    A3 = 16, B3, C3, D3, E3, F3, G3, H3,
    A4 = 24, B4, C4, D4, E4, F4, G4, H4,
    A5 = 32, B5, C5, D5, E5, F5, G5, H5,
    A6 = 40, B6, C6, D6, E6, F6, G6, H6,
    A7 = 48, B7, C7, D7, E7, F7, G7, H7,
    A8 = 56, B8, C8, D8, E8, F8, G8, H8
};

enum MoveFlag : uint8_t {
    FLAG_NORMAL = 0,
    FLAG_PROMOTION = 1,
    FLAG_EN_PASSANT = 2,
    FLAG_CASTLE = 3
};

struct Move {
    int8_t from = -1;
    int8_t to = -1;
    PieceType promotion = NO_PIECE_TYPE;
    Piece captured = EMPTY;
    MoveFlag flag = FLAG_NORMAL;

    Move() = default;
    Move(int8_t f, int8_t t, PieceType prom = NO_PIECE_TYPE, Piece cap = EMPTY, MoveFlag fl = FLAG_NORMAL)
        : from(f), to(t), promotion(prom), captured(cap), flag(fl) {}

    bool is_none() const { return from == -1 || to == -1; }

    std::string to_uci() const {
        if (is_none()) return "0000";
        char f_col = 'a' + (from % 8);
        char f_row = '1' + (from / 8);
        char t_col = 'a' + (to % 8);
        char t_row = '1' + (to / 8);
        std::string uci = "";
        uci += f_col;
        uci += f_row;
        uci += t_col;
        uci += t_row;
        if (promotion != NO_PIECE_TYPE) {
            switch (promotion) {
                case QUEEN: uci += 'q'; break;
                case ROOK: uci += 'r'; break;
                case BISHOP: uci += 'b'; break;
                case KNIGHT: uci += 'n'; break;
                default: break;
            }
        }
        return uci;
    }

    bool operator==(const Move& other) const {
        return from == other.from && to == other.to && promotion == other.promotion;
    }
};

inline Color piece_color(Piece p) {
    if (p >= W_PAWN && p <= W_KING) return WHITE;
    if (p >= B_PAWN && p <= B_KING) return BLACK;
    return NO_COLOR;
}

inline PieceType piece_type(Piece p) {
    if (p == EMPTY) return NO_PIECE_TYPE;
    if (p <= W_KING) return static_cast<PieceType>(p);
    return static_cast<PieceType>(p - 6);
}

inline Piece make_piece(Color c, PieceType pt) {
    if (pt == NO_PIECE_TYPE || c == NO_COLOR) return EMPTY;
    return static_cast<Piece>((c == WHITE ? 0 : 6) + pt);
}

inline std::string square_to_str(int8_t sq) {
    if (sq < 0 || sq > 63) return "-";
    char col = 'a' + (sq % 8);
    char row = '1' + (sq / 8);
    return std::string{col, row};
}

inline int8_t str_to_square(const std::string& s) {
    if (s.length() < 2) return SQ_NONE;
    int col = s[0] - 'a';
    int row = s[1] - '1';
    if (col < 0 || col > 7 || row < 0 || row > 7) return SQ_NONE;
    return static_cast<int8_t>(row * 8 + col);
}

} // namespace NeuroEngine
