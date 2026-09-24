#pragma once
#include <string>
#include <vector>
#include <array>
#include "chess_types.hpp"
#include "zobrist.hpp"

namespace NeuroEngine {

struct UndoInfo {
    Move move;
    Piece captured = EMPTY;
    uint8_t castling_rights = 0;
    int8_t ep_square = -1;
    uint16_t halfmove_clock = 0;
    uint64_t hash = 0;
};

class Position {
public:
    std::array<Piece, 64> board;
    Color side_to_move = WHITE;
    uint8_t castling_rights = 0; // 1: WK, 2: WQ, 4: BK, 8: BQ
    int8_t ep_square = -1;
    uint16_t halfmove_clock = 0;
    uint16_t fullmove_number = 1;
    uint64_t hash = 0;

    std::vector<UndoInfo> history;

    Position();
    bool load_fen(const std::string& fen);
    std::string to_fen() const;

    void generate_pseudo_legal_moves(std::vector<Move>& moves, bool captures_only = false) const;
    void generate_legal_moves(std::vector<Move>& moves) const;

    bool is_attacked(int8_t sq, Color by_color) const;
    bool is_in_check(Color c) const;

    bool make_move(const Move& m);
    void undo_move();

    uint64_t calculate_hash() const;
    int8_t find_king(Color c) const;
};

} // namespace NeuroEngine
