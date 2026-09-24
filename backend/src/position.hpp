#pragma once
#include <string>
#include <vector>
#include "chess_types.hpp"
#include "zobrist.hpp"

namespace NeuroEngine {

// ─────────────────────────────────────────────────────────────────────────────
//  Pre-computed attack tables  (filled once by init_attack_tables())
// ─────────────────────────────────────────────────────────────────────────────
extern Bitboard KNIGHT_ATTACKS[64];
extern Bitboard KING_ATTACKS[64];
extern Bitboard PAWN_ATTACKS[2][64];   // [color][square]

void init_attack_tables();

// ─────────────────────────────────────────────────────────────────────────────
//  Undo information saved before each make_move
// ─────────────────────────────────────────────────────────────────────────────
struct UndoInfo {
    Move     move;
    Piece    captured       = EMPTY;
    uint8_t  castling_rights = 0;
    int8_t   ep_square      = -1;
    uint16_t halfmove_clock  = 0;
    uint64_t hash            = 0;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Position — bitboard-based board representation
//
//  bb[color][piece_type]  : one 64-bit integer per color×piece type
//  by_color[color]        : union of all pieces of that color
//  all                    : every occupied square
//  board[64]              : mailbox for O(1) "what piece is on sq X?"
// ─────────────────────────────────────────────────────────────────────────────
class Position {
public:
    Bitboard bb[2][7];       // [color][PieceType 1-6]
    Bitboard by_color[2];
    Bitboard all;
    Piece    board[64];      // mailbox

    Color    side_to_move    = WHITE;
    uint8_t  castling_rights = 0;    // bits: 0=WK, 1=WQ, 2=BK, 3=BQ
    int8_t   ep_square       = -1;
    uint16_t halfmove_clock  = 0;
    uint16_t fullmove_number = 1;
    uint64_t hash            = 0;

    std::vector<UndoInfo> history;

    // ── Init ──────────────────────────────────────────────────────────────────
    Position();
    bool        load_fen(const std::string& fen);
    std::string to_fen() const;

    // ── Low-level piece manipulation ──────────────────────────────────────────
    void put_piece(Piece p, int sq);
    void remove_piece(int sq);

    // ── Sliding attack generation (on-the-fly ray casting) ───────────────────
    static Bitboard rook_attacks_bb  (int sq, Bitboard occ);
    static Bitboard bishop_attacks_bb(int sq, Bitboard occ);
    static Bitboard queen_attacks_bb (int sq, Bitboard occ);

    // ── Attack / check queries ────────────────────────────────────────────────
    bool is_attacked  (int sq, Color by) const;
    bool is_in_check  (Color c)          const;
    int  find_king    (Color c)          const;

    // ── Move generation ───────────────────────────────────────────────────────
    void generate_pseudo_legal_moves(std::vector<Move>& moves,
                                     bool captures_only = false) const;
    void generate_legal_moves(std::vector<Move>& moves) const;

    // ── Make / Undo ───────────────────────────────────────────────────────────
    // Returns false (and leaves position unchanged) if the move is illegal
    bool make_move(const Move& m);
    void undo_move();

    uint64_t calculate_hash() const;
};

} // namespace NeuroEngine
