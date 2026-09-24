#include "position.hpp"
#include <sstream>
#include <cctype>

namespace NeuroEngine {

static const int8_t KNIGHT_DELTAS[8][2] = {
    {2, 1}, {1, 2}, {-1, 2}, {-2, 1},
    {-2, -1}, {-1, -2}, {1, -2}, {2, -1}
};

static const int8_t BISHOP_DELTAS[4][2] = {
    {1, 1}, {-1, 1}, {1, -1}, {-1, -1}
};

static const int8_t ROOK_DELTAS[4][2] = {
    {0, 1}, {0, -1}, {1, 0}, {-1, 0}
};

static const int8_t KING_DELTAS[8][2] = {
    {0, 1}, {0, -1}, {1, 0}, {-1, 0},
    {1, 1}, {-1, 1}, {1, -1}, {-1, -1}
};

Position::Position() {
    Zobrist::init();
    load_fen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
}

uint64_t Position::calculate_hash() const {
    uint64_t h = 0;
    for (int sq = 0; sq < 64; ++sq) {
        Piece p = board[sq];
        if (p != EMPTY) {
            h ^= Zobrist::piece_keys[p][sq];
        }
    }
    if (side_to_move == BLACK) {
        h ^= Zobrist::side_key;
    }
    h ^= Zobrist::castle_keys[castling_rights & 0xF];
    if (ep_square != -1) {
        h ^= Zobrist::ep_keys[ep_square % 8];
    }
    return h;
}

bool Position::load_fen(const std::string& fen) {
    board.fill(EMPTY);
    history.clear();

    std::stringstream ss(fen);
    std::string pieces_str, turn_str, castling_str, ep_str;
    int halfmove = 0, fullmove = 1;

    ss >> pieces_str >> turn_str >> castling_str >> ep_str >> halfmove >> fullmove;

    int r = 7;
    int c = 0;
    for (char ch : pieces_str) {
        if (ch == '/') {
            r--;
            c = 0;
        } else if (std::isdigit(ch)) {
            c += (ch - '0');
        } else {
            Piece p = EMPTY;
            switch (ch) {
                case 'P': p = W_PAWN; break;
                case 'N': p = W_KNIGHT; break;
                case 'B': p = W_BISHOP; break;
                case 'R': p = W_ROOK; break;
                case 'Q': p = W_QUEEN; break;
                case 'K': p = W_KING; break;
                case 'p': p = B_PAWN; break;
                case 'n': p = B_KNIGHT; break;
                case 'b': p = B_BISHOP; break;
                case 'r': p = B_ROOK; break;
                case 'q': p = B_QUEEN; break;
                case 'k': p = B_KING; break;
                default: break;
            }
            if (p != EMPTY && r >= 0 && r < 8 && c >= 0 && c < 8) {
                board[r * 8 + c] = p;
                c++;
            }
        }
    }

    side_to_move = (turn_str == "b") ? BLACK : WHITE;

    castling_rights = 0;
    if (castling_str.find('K') != std::string::npos) castling_rights |= 1;
    if (castling_str.find('Q') != std::string::npos) castling_rights |= 2;
    if (castling_str.find('k') != std::string::npos) castling_rights |= 4;
    if (castling_str.find('q') != std::string::npos) castling_rights |= 8;

    ep_square = (ep_str == "-" || ep_str.empty()) ? -1 : str_to_square(ep_str);
    halfmove_clock = halfmove;
    fullmove_number = fullmove > 0 ? fullmove : 1;
    hash = calculate_hash();
    return true;
}

std::string Position::to_fen() const {
    std::stringstream ss;
    for (int r = 7; r >= 0; --r) {
        int empty_count = 0;
        for (int c = 0; c < 8; ++c) {
            Piece p = board[r * 8 + c];
            if (p == EMPTY) {
                empty_count++;
            } else {
                if (empty_count > 0) {
                    ss << empty_count;
                    empty_count = 0;
                }
                const char p_chars[] = " PNBRQKpnbrqk";
                ss << p_chars[p];
            }
        }
        if (empty_count > 0) ss << empty_count;
        if (r > 0) ss << '/';
    }

    ss << (side_to_move == WHITE ? " w " : " b ");

    std::string castling = "";
    if (castling_rights & 1) castling += 'K';
    if (castling_rights & 2) castling += 'Q';
    if (castling_rights & 4) castling += 'k';
    if (castling_rights & 8) castling += 'q';
    if (castling.empty()) castling = "-";
    ss << castling << " ";

    ss << (ep_square == -1 ? "-" : square_to_str(ep_square)) << " ";
    ss << halfmove_clock << " " << fullmove_number;

    return ss.str();
}

int8_t Position::find_king(Color c) const {
    Piece target = (c == WHITE) ? W_KING : B_KING;
    for (int sq = 0; sq < 64; ++sq) {
        if (board[sq] == target) return sq;
    }
    return -1;
}

bool Position::is_attacked(int8_t sq, Color by_color) const {
    int r = sq / 8;
    int c = sq % 8;

    // Pawn attacks
    if (by_color == WHITE) {
        if (r > 0 && c > 0 && board[(r - 1) * 8 + (c - 1)] == W_PAWN) return true;
        if (r > 0 && c < 7 && board[(r - 1) * 8 + (c + 1)] == W_PAWN) return true;
    } else {
        if (r < 7 && c > 0 && board[(r + 1) * 8 + (c - 1)] == B_PAWN) return true;
        if (r < 7 && c < 7 && board[(r + 1) * 8 + (c + 1)] == B_PAWN) return true;
    }

    // Knight attacks
    Piece enemy_knight = (by_color == WHITE) ? W_KNIGHT : B_KNIGHT;
    for (int i = 0; i < 8; ++i) {
        int nr = r + KNIGHT_DELTAS[i][1];
        int nc = c + KNIGHT_DELTAS[i][0];
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (board[nr * 8 + nc] == enemy_knight) return true;
        }
    }

    // King attacks
    Piece enemy_king = (by_color == WHITE) ? W_KING : B_KING;
    for (int i = 0; i < 8; ++i) {
        int nr = r + KING_DELTAS[i][1];
        int nc = c + KING_DELTAS[i][0];
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (board[nr * 8 + nc] == enemy_king) return true;
        }
    }

    // Bishop / Queen diagonals
    Piece enemy_bishop = (by_color == WHITE) ? W_BISHOP : B_BISHOP;
    Piece enemy_queen = (by_color == WHITE) ? W_QUEEN : B_QUEEN;
    for (int i = 0; i < 4; ++i) {
        int nr = r + BISHOP_DELTAS[i][1];
        int nc = c + BISHOP_DELTAS[i][0];
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            Piece p = board[nr * 8 + nc];
            if (p != EMPTY) {
                if (p == enemy_bishop || p == enemy_queen) return true;
                break;
            }
            nr += BISHOP_DELTAS[i][1];
            nc += BISHOP_DELTAS[i][0];
        }
    }

    // Rook / Queen straights
    Piece enemy_rook = (by_color == WHITE) ? W_ROOK : B_ROOK;
    for (int i = 0; i < 4; ++i) {
        int nr = r + ROOK_DELTAS[i][1];
        int nc = c + ROOK_DELTAS[i][0];
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            Piece p = board[nr * 8 + nc];
            if (p != EMPTY) {
                if (p == enemy_rook || p == enemy_queen) return true;
                break;
            }
            nr += ROOK_DELTAS[i][1];
            nc += ROOK_DELTAS[i][0];
        }
    }

    return false;
}

bool Position::is_in_check(Color c) const {
    int8_t king_sq = find_king(c);
    if (king_sq == -1) return false;
    return is_attacked(king_sq, (c == WHITE) ? BLACK : WHITE);
}

void Position::generate_pseudo_legal_moves(std::vector<Move>& moves, bool captures_only) const {
    Color us = side_to_move;
    Color them = (us == WHITE) ? BLACK : WHITE;

    for (int sq = 0; sq < 64; ++sq) {
        Piece p = board[sq];
        if (p == EMPTY || piece_color(p) != us) continue;

        PieceType pt = piece_type(p);
        int r = sq / 8;
        int c = sq % 8;

        if (pt == PAWN) {
            int forward = (us == WHITE) ? 1 : -1;
            int start_rank = (us == WHITE) ? 1 : 6;
            int promo_rank = (us == WHITE) ? 7 : 0;

            // Single Push
            int nr = r + forward;
            if (!captures_only && nr >= 0 && nr < 8 && board[nr * 8 + c] == EMPTY) {
                if (nr == promo_rank) {
                    moves.emplace_back(sq, nr * 8 + c, QUEEN, EMPTY, FLAG_PROMOTION);
                    moves.emplace_back(sq, nr * 8 + c, KNIGHT, EMPTY, FLAG_PROMOTION);
                    moves.emplace_back(sq, nr * 8 + c, ROOK, EMPTY, FLAG_PROMOTION);
                    moves.emplace_back(sq, nr * 8 + c, BISHOP, EMPTY, FLAG_PROMOTION);
                } else {
                    moves.emplace_back(sq, nr * 8 + c, NO_PIECE_TYPE, EMPTY, FLAG_NORMAL);
                    // Double Push
                    int nnr = r + 2 * forward;
                    if (r == start_rank && board[nnr * 8 + c] == EMPTY) {
                        moves.emplace_back(sq, nnr * 8 + c, NO_PIECE_TYPE, EMPTY, FLAG_NORMAL);
                    }
                }
            }

            // Captures
            for (int dc : {-1, 1}) {
                int nc = c + dc;
                if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) {
                    int target_sq = nr * 8 + nc;
                    Piece target = board[target_sq];
                    if (target != EMPTY && piece_color(target) == them) {
                        if (nr == promo_rank) {
                            moves.emplace_back(sq, target_sq, QUEEN, target, FLAG_PROMOTION);
                            moves.emplace_back(sq, target_sq, KNIGHT, target, FLAG_PROMOTION);
                            moves.emplace_back(sq, target_sq, ROOK, target, FLAG_PROMOTION);
                            moves.emplace_back(sq, target_sq, BISHOP, target, FLAG_PROMOTION);
                        } else {
                            moves.emplace_back(sq, target_sq, NO_PIECE_TYPE, target, FLAG_NORMAL);
                        }
                    } else if (target_sq == ep_square) {
                        Piece ep_cap = (us == WHITE) ? B_PAWN : W_PAWN;
                        moves.emplace_back(sq, target_sq, NO_PIECE_TYPE, ep_cap, FLAG_EN_PASSANT);
                    }
                }
            }
        } else if (pt == KNIGHT) {
            for (int i = 0; i < 8; ++i) {
                int nr = r + KNIGHT_DELTAS[i][1];
                int nc = c + KNIGHT_DELTAS[i][0];
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    int target_sq = nr * 8 + nc;
                    Piece target = board[target_sq];
                    if (target == EMPTY) {
                        if (!captures_only) moves.emplace_back(sq, target_sq, NO_PIECE_TYPE, EMPTY, FLAG_NORMAL);
                    } else if (piece_color(target) == them) {
                        moves.emplace_back(sq, target_sq, NO_PIECE_TYPE, target, FLAG_NORMAL);
                    }
                }
            }
        } else if (pt == BISHOP || pt == ROOK || pt == QUEEN) {
            const int8_t (*deltas)[2] = (pt == BISHOP) ? BISHOP_DELTAS : (pt == ROOK ? ROOK_DELTAS : KING_DELTAS);
            int count = (pt == QUEEN) ? 8 : 4;

            for (int i = 0; i < count; ++i) {
                int nr = r + deltas[i][1];
                int nc = c + deltas[i][0];
                while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    int target_sq = nr * 8 + nc;
                    Piece target = board[target_sq];
                    if (target == EMPTY) {
                        if (!captures_only) moves.emplace_back(sq, target_sq, NO_PIECE_TYPE, EMPTY, FLAG_NORMAL);
                    } else {
                        if (piece_color(target) == them) {
                            moves.emplace_back(sq, target_sq, NO_PIECE_TYPE, target, FLAG_NORMAL);
                        }
                        break;
                    }
                    nr += deltas[i][1];
                    nc += deltas[i][0];
                }
            }
        } else if (pt == KING) {
            for (int i = 0; i < 8; ++i) {
                int nr = r + KING_DELTAS[i][1];
                int nc = c + KING_DELTAS[i][0];
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    int target_sq = nr * 8 + nc;
                    Piece target = board[target_sq];
                    if (target == EMPTY) {
                        if (!captures_only) moves.emplace_back(sq, target_sq, NO_PIECE_TYPE, EMPTY, FLAG_NORMAL);
                    } else if (piece_color(target) == them) {
                        moves.emplace_back(sq, target_sq, NO_PIECE_TYPE, target, FLAG_NORMAL);
                    }
                }
            }

            // Castling
            if (!captures_only && !is_in_check(us)) {
                if (us == WHITE) {
                    if ((castling_rights & 1) && board[F1] == EMPTY && board[G1] == EMPTY &&
                        !is_attacked(F1, BLACK) && !is_attacked(G1, BLACK)) {
                        moves.emplace_back(E1, G1, NO_PIECE_TYPE, EMPTY, FLAG_CASTLE);
                    }
                    if ((castling_rights & 2) && board[D1] == EMPTY && board[C1] == EMPTY && board[B1] == EMPTY &&
                        !is_attacked(D1, BLACK) && !is_attacked(C1, BLACK)) {
                        moves.emplace_back(E1, C1, NO_PIECE_TYPE, EMPTY, FLAG_CASTLE);
                    }
                } else {
                    if ((castling_rights & 4) && board[F8] == EMPTY && board[G8] == EMPTY &&
                        !is_attacked(F8, WHITE) && !is_attacked(G8, WHITE)) {
                        moves.emplace_back(E8, G8, NO_PIECE_TYPE, EMPTY, FLAG_CASTLE);
                    }
                    if ((castling_rights & 8) && board[D8] == EMPTY && board[C8] == EMPTY && board[B8] == EMPTY &&
                        !is_attacked(D8, WHITE) && !is_attacked(C8, WHITE)) {
                        moves.emplace_back(E8, C8, NO_PIECE_TYPE, EMPTY, FLAG_CASTLE);
                    }
                }
            }
        }
    }
}

bool Position::make_move(const Move& m) {
    UndoInfo undo;
    undo.move = m;
    undo.castling_rights = castling_rights;
    undo.ep_square = ep_square;
    undo.halfmove_clock = halfmove_clock;
    undo.hash = hash;
    undo.captured = board[m.to];

    Piece moving = board[m.from];
    Color us = side_to_move;
    Color them = (us == WHITE) ? BLACK : WHITE;

    halfmove_clock++;
    if (piece_type(moving) == PAWN || m.captured != EMPTY) {
        halfmove_clock = 0;
    }

    ep_square = -1;

    if (m.flag == FLAG_EN_PASSANT) {
        int cap_sq = (us == WHITE) ? m.to - 8 : m.to + 8;
        undo.captured = board[cap_sq];
        board[cap_sq] = EMPTY;
    } else if (m.flag == FLAG_CASTLE) {
        if (m.to == G1) { board[F1] = board[H1]; board[H1] = EMPTY; }
        else if (m.to == C1) { board[D1] = board[A1]; board[A1] = EMPTY; }
        else if (m.to == G8) { board[F8] = board[H8]; board[H8] = EMPTY; }
        else if (m.to == C8) { board[D8] = board[A8]; board[A8] = EMPTY; }
    } else if (piece_type(moving) == PAWN && std::abs(m.to - m.from) == 16) {
        ep_square = (m.from + m.to) / 2;
    }

    board[m.from] = EMPTY;
    if (m.promotion != NO_PIECE_TYPE) {
        board[m.to] = make_piece(us, m.promotion);
    } else {
        board[m.to] = moving;
    }

    // Update castling rights
    if (m.from == E1 || m.to == E1) castling_rights &= ~3;
    if (m.from == E8 || m.to == E8) castling_rights &= ~12;
    if (m.from == H1 || m.to == H1) castling_rights &= ~1;
    if (m.from == A1 || m.to == A1) castling_rights &= ~2;
    if (m.from == H8 || m.to == H8) castling_rights &= ~4;
    if (m.from == A8 || m.to == A8) castling_rights &= ~8;

    side_to_move = them;
    if (us == BLACK) fullmove_number++;

    history.push_back(undo);

    if (is_in_check(us)) {
        undo_move();
        return false;
    }

    hash = calculate_hash();
    return true;
}

void Position::undo_move() {
    if (history.empty()) return;
    const UndoInfo& undo = history.back();
    const Move& m = undo.move;

    Color us = (side_to_move == WHITE) ? BLACK : WHITE; // player who made the move
    side_to_move = us;
    if (us == BLACK) fullmove_number--;

    castling_rights = undo.castling_rights;
    ep_square = undo.ep_square;
    halfmove_clock = undo.halfmove_clock;
    hash = undo.hash;

    Piece piece_at_to = board[m.to];
    board[m.to] = undo.captured;
    board[m.from] = (m.promotion != NO_PIECE_TYPE) ? make_piece(us, PAWN) : piece_at_to;

    if (m.flag == FLAG_EN_PASSANT) {
        int cap_sq = (us == WHITE) ? m.to - 8 : m.to + 8;
        board[cap_sq] = undo.captured;
        board[m.to] = EMPTY;
    } else if (m.flag == FLAG_CASTLE) {
        if (m.to == G1) { board[H1] = board[F1]; board[F1] = EMPTY; }
        else if (m.to == C1) { board[A1] = board[D1]; board[D1] = EMPTY; }
        else if (m.to == G8) { board[H8] = board[F8]; board[F8] = EMPTY; }
        else if (m.to == C8) { board[A8] = board[D8]; board[D8] = EMPTY; }
    }

    history.pop_back();
}

void Position::generate_legal_moves(std::vector<Move>& legal_moves) const {
    legal_moves.clear();
    std::vector<Move> pseudo_moves;
    generate_pseudo_legal_moves(pseudo_moves, false);

    Position* non_const_pos = const_cast<Position*>(this);
    for (const auto& m : pseudo_moves) {
        if (non_const_pos->make_move(m)) {
            legal_moves.push_back(m);
            non_const_pos->undo_move();
        }
    }
}

} // namespace NeuroEngine
