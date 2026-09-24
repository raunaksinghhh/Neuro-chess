#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace NeuroEngine {

// ─────────────────────────────────────────────────────────────────────────────
//  Bitboard type  (64-bit integer, one bit per square)
//  Square mapping: bit 0 = A1, bit 7 = H1, bit 8 = A2 … bit 63 = H8
// ─────────────────────────────────────────────────────────────────────────────
using Bitboard = uint64_t;

// ── Bitboard constants ────────────────────────────────────────────────────────
constexpr Bitboard BB_EMPTY  = 0ULL;
constexpr Bitboard BB_ALL    = ~0ULL;
constexpr Bitboard BB_FILE_A = 0x0101010101010101ULL;
constexpr Bitboard BB_FILE_B = 0x0202020202020202ULL;
constexpr Bitboard BB_FILE_G = 0x4040404040404040ULL;
constexpr Bitboard BB_FILE_H = 0x8080808080808080ULL;
constexpr Bitboard BB_RANK_1 = 0x00000000000000FFULL;
constexpr Bitboard BB_RANK_2 = 0x000000000000FF00ULL;
constexpr Bitboard BB_RANK_3 = 0x0000000000FF0000ULL;
constexpr Bitboard BB_RANK_6 = 0x0000FF0000000000ULL;
constexpr Bitboard BB_RANK_7 = 0x00FF000000000000ULL;
constexpr Bitboard BB_RANK_8 = 0xFF00000000000000ULL;

// ── Bitboard utilities ────────────────────────────────────────────────────────
inline Bitboard  sq_bb(int sq)      { return 1ULL << sq; }
inline int       rank_of(int sq)    { return sq >> 3; }
inline int       file_of(int sq)    { return sq & 7; }
inline int       popcount(Bitboard b){ return __builtin_popcountll(b); }
inline int       lsb(Bitboard b)    { return __builtin_ctzll(b); }
inline int       pop_lsb(Bitboard& b){ int s = lsb(b); b &= b - 1; return s; }

// ── Piece types / colors ──────────────────────────────────────────────────────
enum Color : uint8_t { WHITE = 0, BLACK = 1, NO_COLOR = 2 };

enum PieceType : uint8_t {
    NO_PIECE_TYPE = 0,
    PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6
};

// Piece enum: 0=EMPTY, 1-6=White pieces, 7-12=Black pieces
enum Piece : uint8_t {
    EMPTY    = 0,
    W_PAWN   = 1, W_KNIGHT = 2, W_BISHOP = 3,
    W_ROOK   = 4, W_QUEEN  = 5, W_KING   = 6,
    B_PAWN   = 7, B_KNIGHT = 8, B_BISHOP = 9,
    B_ROOK   = 10, B_QUEEN = 11, B_KING  = 12
};

// ── Square enum  (A1=0 … H8=63) ──────────────────────────────────────────────
enum Square : int8_t {
    SQ_NONE = -1,
    A1=0,B1,C1,D1,E1,F1,G1,H1,
    A2=8, B2,C2,D2,E2,F2,G2,H2,
    A3=16,B3,C3,D3,E3,F3,G3,H3,
    A4=24,B4,C4,D4,E4,F4,G4,H4,
    A5=32,B5,C5,D5,E5,F5,G5,H5,
    A6=40,B6,C6,D6,E6,F6,G6,H6,
    A7=48,B7,C7,D7,E7,F7,G7,H7,
    A8=56,B8,C8,D8,E8,F8,G8,H8
};

// ── Move flags ────────────────────────────────────────────────────────────────
enum MoveFlag : uint8_t {
    FLAG_NORMAL    = 0,
    FLAG_PROMOTION = 1,
    FLAG_EN_PASSANT= 2,
    FLAG_CASTLE    = 3
};

// ── Move struct ───────────────────────────────────────────────────────────────
struct Move {
    int8_t    from      = -1;
    int8_t    to        = -1;
    PieceType promotion = NO_PIECE_TYPE;
    Piece     captured  = EMPTY;
    MoveFlag  flag      = FLAG_NORMAL;

    Move() = default;
    Move(int8_t f, int8_t t,
         PieceType prom = NO_PIECE_TYPE,
         Piece cap      = EMPTY,
         MoveFlag fl    = FLAG_NORMAL)
        : from(f), to(t), promotion(prom), captured(cap), flag(fl) {}

    bool is_none() const { return from < 0 || to < 0; }

    std::string to_uci() const {
        if (is_none()) return "0000";
        std::string s;
        s += char('a' + (from & 7));
        s += char('1' + (from >> 3));
        s += char('a' + (to   & 7));
        s += char('1' + (to   >> 3));
        if (promotion != NO_PIECE_TYPE) {
            switch (promotion) {
                case QUEEN:  s += 'q'; break;
                case ROOK:   s += 'r'; break;
                case BISHOP: s += 'b'; break;
                case KNIGHT: s += 'n'; break;
                default: break;
            }
        }
        return s;
    }

    bool operator==(const Move& o) const {
        return from == o.from && to == o.to && promotion == o.promotion;
    }
};

// ── Piece helpers ─────────────────────────────────────────────────────────────
inline Color piece_color(Piece p) {
    if (p >= W_PAWN && p <= W_KING) return WHITE;
    if (p >= B_PAWN && p <= B_KING) return BLACK;
    return NO_COLOR;
}

inline PieceType piece_type(Piece p) {
    if (p == EMPTY) return NO_PIECE_TYPE;
    return static_cast<PieceType>(p <= W_KING ? p : p - 6);
}

inline Piece make_piece(Color c, PieceType pt) {
    if (pt == NO_PIECE_TYPE || c == NO_COLOR) return EMPTY;
    return static_cast<Piece>((c == WHITE ? 0 : 6) + pt);
}

// ── Square string helpers ─────────────────────────────────────────────────────
inline std::string square_to_str(int8_t sq) {
    if (sq < 0 || sq > 63) return "-";
    return { char('a' + (sq & 7)), char('1' + (sq >> 3)) };
}

inline int8_t str_to_square(const std::string& s) {
    if (s.size() < 2) return SQ_NONE;
    int col = s[0] - 'a', row = s[1] - '1';
    if (col < 0 || col > 7 || row < 0 || row > 7) return SQ_NONE;
    return static_cast<int8_t>(row * 8 + col);
}

} // namespace NeuroEngine
