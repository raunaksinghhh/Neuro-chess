#include "position.hpp"
#include <sstream>
#include <cstring>
#include <cassert>

namespace NeuroEngine {

// =============================================================================
//  Attack tables
// =============================================================================

Bitboard KNIGHT_ATTACKS[64];
Bitboard KING_ATTACKS[64];
Bitboard PAWN_ATTACKS[2][64];

static bool s_tables_init = false;

void init_attack_tables() {
    if (s_tables_init) return;
    s_tables_init = true;

    for (int sq = 0; sq < 64; ++sq) {
        int r = rank_of(sq), f = file_of(sq);
        Bitboard b = sq_bb(sq);

        // ── Knight ──────────────────────────────────────────────────────────
        Bitboard kn = 0;
        const int kndr[] = { 2, 2,-2,-2, 1, 1,-1,-1};
        const int kndf[] = { 1,-1, 1,-1, 2,-2, 2,-2};
        for (int i = 0; i < 8; ++i) {
            int nr = r + kndr[i], nf = f + kndf[i];
            if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8)
                kn |= sq_bb(nr * 8 + nf);
        }
        KNIGHT_ATTACKS[sq] = kn;

        // ── King ────────────────────────────────────────────────────────────
        Bitboard kg = 0;
        for (int dr = -1; dr <= 1; ++dr)
            for (int df = -1; df <= 1; ++df) {
                if (!dr && !df) continue;
                int nr = r + dr, nf = f + df;
                if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8)
                    kg |= sq_bb(nr * 8 + nf);
            }
        KING_ATTACKS[sq] = kg;

        // ── Pawn (captures only, colour-aware) ───────────────────────────────
        Bitboard pw = 0, pb = 0;
        // White pawn on sq attacks north-east and north-west
        if (r < 7) {
            if (f > 0) pw |= sq_bb(sq + 7);
            if (f < 7) pw |= sq_bb(sq + 9);
        }
        // Black pawn on sq attacks south-east and south-west
        if (r > 0) {
            if (f > 0) pb |= sq_bb(sq - 9);
            if (f < 7) pb |= sq_bb(sq - 7);
        }
        PAWN_ATTACKS[WHITE][sq] = pw;
        PAWN_ATTACKS[BLACK][sq] = pb;
    }
}

// =============================================================================
//  Sliding attack generation — classical ray casting, O(ray length)
// =============================================================================

Bitboard Position::rook_attacks_bb(int sq, Bitboard occ) {
    Bitboard atk = 0;
    int r = rank_of(sq), f = file_of(sq);
    // north
    for (int i = r+1; i < 8; ++i) { Bitboard b = sq_bb(i*8+f); atk|=b; if(occ&b) break; }
    // south
    for (int i = r-1; i >= 0; --i) { Bitboard b = sq_bb(i*8+f); atk|=b; if(occ&b) break; }
    // east
    for (int j = f+1; j < 8; ++j) { Bitboard b = sq_bb(r*8+j); atk|=b; if(occ&b) break; }
    // west
    for (int j = f-1; j >= 0; --j) { Bitboard b = sq_bb(r*8+j); atk|=b; if(occ&b) break; }
    return atk;
}

Bitboard Position::bishop_attacks_bb(int sq, Bitboard occ) {
    Bitboard atk = 0;
    int r = rank_of(sq), f = file_of(sq);
    // NE
    for (int i=1; r+i<8 && f+i<8; ++i) { Bitboard b=sq_bb((r+i)*8+(f+i)); atk|=b; if(occ&b) break; }
    // NW
    for (int i=1; r+i<8 && f-i>=0; ++i) { Bitboard b=sq_bb((r+i)*8+(f-i)); atk|=b; if(occ&b) break; }
    // SE
    for (int i=1; r-i>=0 && f+i<8; ++i) { Bitboard b=sq_bb((r-i)*8+(f+i)); atk|=b; if(occ&b) break; }
    // SW
    for (int i=1; r-i>=0 && f-i>=0; ++i) { Bitboard b=sq_bb((r-i)*8+(f-i)); atk|=b; if(occ&b) break; }
    return atk;
}

Bitboard Position::queen_attacks_bb(int sq, Bitboard occ) {
    return rook_attacks_bb(sq, occ) | bishop_attacks_bb(sq, occ);
}

// =============================================================================
//  Position — construction and FEN
// =============================================================================

Position::Position() {
    init_attack_tables();
    Zobrist::init();
    memset(bb,       0, sizeof(bb));
    memset(by_color, 0, sizeof(by_color));
    all = 0;
    memset(board, 0, sizeof(board));
    load_fen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
}

void Position::put_piece(Piece p, int sq) {
    board[sq] = p;
    Color c   = piece_color(p);
    PieceType pt = piece_type(p);
    Bitboard mask = sq_bb(sq);
    bb[c][pt]   |= mask;
    by_color[c] |= mask;
    all         |= mask;
}

void Position::remove_piece(int sq) {
    Piece p = board[sq];
    if (p == EMPTY) return;
    Color c   = piece_color(p);
    PieceType pt = piece_type(p);
    Bitboard mask = sq_bb(sq);
    bb[c][pt]   &= ~mask;
    by_color[c] &= ~mask;
    all         &= ~mask;
    board[sq]    = EMPTY;
}

bool Position::load_fen(const std::string& fen) {
    // Reset
    memset(bb,       0, sizeof(bb));
    memset(by_color, 0, sizeof(by_color));
    all = 0;
    memset(board, 0, sizeof(board));
    castling_rights = 0;
    ep_square       = -1;
    halfmove_clock  = 0;
    fullmove_number = 1;
    history.clear();

    std::istringstream ss(fen);
    std::string piece_part, turn, castle, ep, hm, fm;
    ss >> piece_part >> turn >> castle >> ep >> hm >> fm;

    // ── Piece placement ──────────────────────────────────────────────────────
    int rank = 7, file = 0;
    for (char c : piece_part) {
        if (c == '/') { --rank; file = 0; continue; }
        if (c >= '1' && c <= '8') { file += c - '0'; continue; }
        if (rank < 0 || rank > 7 || file > 7) return false;
        int sq = rank * 8 + file;
        Piece p = EMPTY;
        switch (c) {
            case 'P': p = W_PAWN;   break; case 'N': p = W_KNIGHT; break;
            case 'B': p = W_BISHOP; break; case 'R': p = W_ROOK;   break;
            case 'Q': p = W_QUEEN;  break; case 'K': p = W_KING;   break;
            case 'p': p = B_PAWN;   break; case 'n': p = B_KNIGHT; break;
            case 'b': p = B_BISHOP; break; case 'r': p = B_ROOK;   break;
            case 'q': p = B_QUEEN;  break; case 'k': p = B_KING;   break;
            default: return false;
        }
        put_piece(p, sq);
        ++file;
    }

    // ── Side to move ─────────────────────────────────────────────────────────
    side_to_move = (turn == "b") ? BLACK : WHITE;

    // ── Castling rights ──────────────────────────────────────────────────────
    for (char c : castle) {
        if (c == 'K') castling_rights |= 1;
        if (c == 'Q') castling_rights |= 2;
        if (c == 'k') castling_rights |= 4;
        if (c == 'q') castling_rights |= 8;
    }

    // ── En passant ───────────────────────────────────────────────────────────
    if (ep != "-") ep_square = str_to_square(ep);

    // ── Clocks ───────────────────────────────────────────────────────────────
    if (!hm.empty()) halfmove_clock  = static_cast<uint16_t>(std::stoi(hm));
    if (!fm.empty()) fullmove_number = static_cast<uint16_t>(std::stoi(fm));

    hash = calculate_hash();
    return true;
}

std::string Position::to_fen() const {
    static const char piece_chars[] = ".PNBRQKpnbrqk";
    std::string fen;

    for (int r = 7; r >= 0; --r) {
        int empty = 0;
        for (int f = 0; f < 8; ++f) {
            Piece p = board[r * 8 + f];
            if (p == EMPTY) { ++empty; continue; }
            if (empty) { fen += char('0' + empty); empty = 0; }
            fen += piece_chars[p];
        }
        if (empty) fen += char('0' + empty);
        if (r > 0) fen += '/';
    }

    fen += (side_to_move == WHITE) ? " w " : " b ";

    std::string castle;
    if (castling_rights & 1) castle += 'K';
    if (castling_rights & 2) castle += 'Q';
    if (castling_rights & 4) castle += 'k';
    if (castling_rights & 8) castle += 'q';
    fen += castle.empty() ? "-" : castle;

    fen += ' ';
    fen += (ep_square >= 0) ? square_to_str(ep_square) : "-";
    fen += ' ';
    fen += std::to_string(halfmove_clock);
    fen += ' ';
    fen += std::to_string(fullmove_number);
    return fen;
}

// =============================================================================
//  Attack queries
// =============================================================================

bool Position::is_attacked(int sq, Color by) const {
    if (sq < 0 || sq > 63) return false;
    Color opp = (by == WHITE) ? BLACK : WHITE;

    // Pawn: PAWN_ATTACKS[opp][sq] gives squares from which 'by'-coloured pawns attack sq
    if (PAWN_ATTACKS[opp][sq] & bb[by][PAWN])   return true;
    if (KNIGHT_ATTACKS[sq]    & bb[by][KNIGHT])  return true;
    if (KING_ATTACKS[sq]      & bb[by][KING])    return true;
    if (bishop_attacks_bb(sq, all) & (bb[by][BISHOP] | bb[by][QUEEN])) return true;
    if (rook_attacks_bb  (sq, all) & (bb[by][ROOK]   | bb[by][QUEEN])) return true;
    return false;
}

bool Position::is_in_check(Color c) const {
    int ksq = find_king(c);
    if (ksq < 0) return false;
    return is_attacked(ksq, c == WHITE ? BLACK : WHITE);
}

int Position::find_king(Color c) const {
    Bitboard kings = bb[c][KING];
    return kings ? lsb(kings) : -1;
}

// =============================================================================
//  Pseudo-legal move generation
// =============================================================================

void Position::generate_pseudo_legal_moves(std::vector<Move>& moves,
                                           bool captures_only) const {
    Color us   = side_to_move;
    Color them = (us == WHITE) ? BLACK : WHITE;

    Bitboard our  = by_color[us];
    Bitboard thei = by_color[them];
    Bitboard occ  = all;
    Bitboard free = ~occ;

    // Helper — emit regular move (with optional cap)
    auto push = [&](int from, int to) {
        moves.emplace_back(Move(from, to, NO_PIECE_TYPE, board[to]));
    };

    // ── PAWNS ─────────────────────────────────────────────────────────────────
    {
        Bitboard pawns = bb[us][PAWN];

        if (us == WHITE) {
            Bitboard push1   = (pawns << 8) & free;
            Bitboard push2   = ((push1 & BB_RANK_3) << 8) & free;
            Bitboard cap_nw  = ((pawns & ~BB_FILE_A) << 7) & thei;
            Bitboard cap_ne  = ((pawns & ~BB_FILE_H) << 9) & thei;

            if (!captures_only) {
                // Non-promotion single push
                Bitboard pp = push1 & ~BB_RANK_8;
                while (pp) { int t = pop_lsb(pp); push(t-8, t); }
                // Double push
                Bitboard dp = push2;
                while (dp) { int t = pop_lsb(dp); push(t-16, t); }
                // Promotion push
                Bitboard pr = push1 & BB_RANK_8;
                while (pr) {
                    int t = pop_lsb(pr);
                    for (PieceType pt : {QUEEN,ROOK,BISHOP,KNIGHT})
                        moves.emplace_back(t-8, t, pt, EMPTY, FLAG_PROMOTION);
                }
            }
            // Capture left (NW)
            while (cap_nw) {
                int t = pop_lsb(cap_nw); Piece cap = board[t];
                if (t >= 56) { for (PieceType pt : {QUEEN,ROOK,BISHOP,KNIGHT}) moves.emplace_back(t-7, t, pt, cap, FLAG_PROMOTION); }
                else         { moves.emplace_back(t-7, t, NO_PIECE_TYPE, cap); }
            }
            // Capture right (NE)
            while (cap_ne) {
                int t = pop_lsb(cap_ne); Piece cap = board[t];
                if (t >= 56) { for (PieceType pt : {QUEEN,ROOK,BISHOP,KNIGHT}) moves.emplace_back(t-9, t, pt, cap, FLAG_PROMOTION); }
                else         { moves.emplace_back(t-9, t, NO_PIECE_TYPE, cap); }
            }
        } else { // BLACK
            Bitboard push1  = (pawns >> 8) & free;
            Bitboard push2  = ((push1 & BB_RANK_6) >> 8) & free;
            Bitboard cap_sw = ((pawns & ~BB_FILE_H) >> 7) & thei;
            Bitboard cap_se = ((pawns & ~BB_FILE_A) >> 9) & thei;

            if (!captures_only) {
                Bitboard pp = push1 & ~BB_RANK_1;
                while (pp) { int t = pop_lsb(pp); push(t+8, t); }
                Bitboard dp = push2;
                while (dp) { int t = pop_lsb(dp); push(t+16, t); }
                Bitboard pr = push1 & BB_RANK_1;
                while (pr) {
                    int t = pop_lsb(pr);
                    for (PieceType pt : {QUEEN,ROOK,BISHOP,KNIGHT})
                        moves.emplace_back(t+8, t, pt, EMPTY, FLAG_PROMOTION);
                }
            }
            while (cap_sw) {
                int t = pop_lsb(cap_sw); Piece cap = board[t];
                if (t < 8) { for (PieceType pt : {QUEEN,ROOK,BISHOP,KNIGHT}) moves.emplace_back(t+7, t, pt, cap, FLAG_PROMOTION); }
                else       { moves.emplace_back(t+7, t, NO_PIECE_TYPE, cap); }
            }
            while (cap_se) {
                int t = pop_lsb(cap_se); Piece cap = board[t];
                if (t < 8) { for (PieceType pt : {QUEEN,ROOK,BISHOP,KNIGHT}) moves.emplace_back(t+9, t, pt, cap, FLAG_PROMOTION); }
                else       { moves.emplace_back(t+9, t, NO_PIECE_TYPE, cap); }
            }
        }

        // En passant (both colours)
        if (ep_square >= 0) {
            // Squares from which our pawns attack ep_square = PAWN_ATTACKS[them][ep_sq]
            Bitboard ep_pawns = PAWN_ATTACKS[them][ep_square] & pawns;
            while (ep_pawns) {
                int from = pop_lsb(ep_pawns);
                moves.emplace_back(from, ep_square, NO_PIECE_TYPE,
                                   make_piece(them, PAWN), FLAG_EN_PASSANT);
            }
        }
    }

    // ── KNIGHTS ───────────────────────────────────────────────────────────────
    {
        Bitboard kn = bb[us][KNIGHT];
        while (kn) {
            int from = pop_lsb(kn);
            Bitboard atk = KNIGHT_ATTACKS[from] & ~our;
            if (captures_only) atk &= thei;
            while (atk) { int t = pop_lsb(atk); push(from, t); }
        }
    }

    // ── BISHOPS ───────────────────────────────────────────────────────────────
    {
        Bitboard bi = bb[us][BISHOP];
        while (bi) {
            int from = pop_lsb(bi);
            Bitboard atk = bishop_attacks_bb(from, occ) & ~our;
            if (captures_only) atk &= thei;
            while (atk) { int t = pop_lsb(atk); push(from, t); }
        }
    }

    // ── ROOKS ─────────────────────────────────────────────────────────────────
    {
        Bitboard ro = bb[us][ROOK];
        while (ro) {
            int from = pop_lsb(ro);
            Bitboard atk = rook_attacks_bb(from, occ) & ~our;
            if (captures_only) atk &= thei;
            while (atk) { int t = pop_lsb(atk); push(from, t); }
        }
    }

    // ── QUEENS ────────────────────────────────────────────────────────────────
    {
        Bitboard qu = bb[us][QUEEN];
        while (qu) {
            int from = pop_lsb(qu);
            Bitboard atk = queen_attacks_bb(from, occ) & ~our;
            if (captures_only) atk &= thei;
            while (atk) { int t = pop_lsb(atk); push(from, t); }
        }
    }

    // ── KING (moves + castling) ────────────────────────────────────────────────
    {
        Bitboard kg = bb[us][KING];
        if (kg) {
            int from = lsb(kg);
            Bitboard atk = KING_ATTACKS[from] & ~our;
            if (captures_only) atk &= thei;
            while (atk) { int t = pop_lsb(atk); push(from, t); }

            if (!captures_only) {
                if (us == WHITE) {
                    // King-side: e1(4)->g1(6), need f1(5) g1(6) empty, e1 f1 g1 not attacked
                    if ((castling_rights & 1) && !(occ & 0x60ULL) &&
                        !is_attacked(4, BLACK) && !is_attacked(5, BLACK) && !is_attacked(6, BLACK))
                        moves.emplace_back(4, 6, NO_PIECE_TYPE, EMPTY, FLAG_CASTLE);
                    // Queen-side: e1(4)->c1(2), need b1(1) c1(2) d1(3) empty, e1 d1 c1 not attacked
                    if ((castling_rights & 2) && !(occ & 0xEULL) &&
                        !is_attacked(4, BLACK) && !is_attacked(3, BLACK) && !is_attacked(2, BLACK))
                        moves.emplace_back(4, 2, NO_PIECE_TYPE, EMPTY, FLAG_CASTLE);
                } else {
                    // King-side: e8(60)->g8(62)
                    if ((castling_rights & 4) && !(occ & 0x6000000000000000ULL) &&
                        !is_attacked(60, WHITE) && !is_attacked(61, WHITE) && !is_attacked(62, WHITE))
                        moves.emplace_back(60, 62, NO_PIECE_TYPE, EMPTY, FLAG_CASTLE);
                    // Queen-side: e8(60)->c8(58)
                    if ((castling_rights & 8) && !(occ & 0x0E00000000000000ULL) &&
                        !is_attacked(60, WHITE) && !is_attacked(59, WHITE) && !is_attacked(58, WHITE))
                        moves.emplace_back(60, 58, NO_PIECE_TYPE, EMPTY, FLAG_CASTLE);
                }
            }
        }
    }
}

// =============================================================================
//  Legal move generation — generate pseudo-legal then filter with make/undo
// =============================================================================

void Position::generate_legal_moves(std::vector<Move>& moves) const {
    std::vector<Move> pseudo;
    pseudo.reserve(80);
    generate_pseudo_legal_moves(pseudo);

    moves.reserve(pseudo.size());
    Position copy;
    for (const Move& m : pseudo) {
        copy = *this;
        if (copy.make_move(m))
            moves.push_back(m);
    }
}

// =============================================================================
//  Make / Undo
// =============================================================================

// Castling mask: ANDing src/dst squares clears forfeited castling rights
static const uint8_t CASTLE_MASK[64] = {
    0xFE,0xFF,0xFF,0xFF,0xFC,0xFF,0xFF,0xFD, // a1-h1  (WQ=bit1, WK=bit0)
    0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
    0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
    0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
    0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
    0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
    0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
    0xFB,0xFF,0xFF,0xFF,0xF3,0xFF,0xFF,0xF7  // a8-h8  (BQ=bit3, BK=bit2)
};

bool Position::make_move(const Move& m) {
    Color us   = side_to_move;
    Color them = (us == WHITE) ? BLACK : WHITE;

    // Save undo state
    UndoInfo u;
    u.move             = m;
    u.captured         = board[m.to];
    u.castling_rights  = castling_rights;
    u.ep_square        = ep_square;
    u.halfmove_clock   = halfmove_clock;
    u.hash             = hash;

    // Update halfmove clock
    halfmove_clock = (piece_type(board[m.from]) == PAWN || m.captured != EMPTY) ? 0 : halfmove_clock + 1;

    // Clear old EP
    ep_square = -1;

    // ── Special moves ──────────────────────────────────────────────────────────
    if (m.flag == FLAG_EN_PASSANT) {
        int cap_sq = (us == WHITE) ? m.to - 8 : m.to + 8;
        remove_piece(cap_sq);
        u.captured = make_piece(them, PAWN);
    } else if (m.flag == FLAG_CASTLE) {
        // Move rook
        int rf, rt;
        if      (m.to == 6)  { rf = 7;  rt = 5;  }  // WK
        else if (m.to == 2)  { rf = 0;  rt = 3;  }  // WQ
        else if (m.to == 62) { rf = 63; rt = 61; }  // BK
        else                 { rf = 56; rt = 59; }  // BQ
        Piece rook = board[rf];
        remove_piece(rf);
        put_piece(rook, rt);
    }

    // Remove capture (non-EP)
    if (m.captured != EMPTY && m.flag != FLAG_EN_PASSANT)
        remove_piece(m.to);

    // Move the piece
    Piece moving = board[m.from];
    remove_piece(m.from);
    put_piece((m.flag == FLAG_PROMOTION) ? make_piece(us, m.promotion) : moving, m.to);

    // Set new EP square on double pawn push
    if (piece_type(moving) == PAWN && abs(m.to - m.from) == 16)
        ep_square = (m.from + m.to) / 2;

    // Update castling rights
    castling_rights &= CASTLE_MASK[m.from] & CASTLE_MASK[m.to];

    // Switch side
    side_to_move = them;
    if (us == BLACK) ++fullmove_number;

    history.push_back(u);

    // Legality check: our king must not be in check after the move
    if (is_in_check(us)) {
        undo_move();
        return false;
    }

    hash = calculate_hash();
    return true;
}

void Position::undo_move() {
    if (history.empty()) return;
    UndoInfo u = history.back();
    history.pop_back();

    const Move& m = u.move;
    Color them = side_to_move;            // just-moved side
    Color us   = (them == WHITE) ? BLACK : WHITE;

    // Restore state
    side_to_move    = us;
    castling_rights = u.castling_rights;
    ep_square       = u.ep_square;
    halfmove_clock  = u.halfmove_clock;
    hash            = u.hash;
    if (them == BLACK) --fullmove_number;

    Piece moved = board[m.to];

    if (m.flag == FLAG_CASTLE) {
        // Move king back
        remove_piece(m.to);
        put_piece(moved, m.from);
        // Move rook back
        int rf, rt;
        if      (m.to == 6)  { rf = 7;  rt = 5;  }
        else if (m.to == 2)  { rf = 0;  rt = 3;  }
        else if (m.to == 62) { rf = 63; rt = 61; }
        else                 { rf = 56; rt = 59; }
        Piece rook = board[rt];
        remove_piece(rt);
        put_piece(rook, rf);
    } else if (m.flag == FLAG_EN_PASSANT) {
        remove_piece(m.to);
        put_piece(moved, m.from);
        int cap_sq = (us == WHITE) ? m.to - 8 : m.to + 8;
        put_piece(make_piece(them, PAWN), cap_sq);
    } else if (m.flag == FLAG_PROMOTION) {
        // Restore pawn at from, restore captured piece at to
        remove_piece(m.to);
        put_piece(make_piece(us, PAWN), m.from);
        if (u.captured != EMPTY) put_piece(u.captured, m.to);
    } else {
        // Normal move
        remove_piece(m.to);
        put_piece(moved, m.from);
        if (u.captured != EMPTY) put_piece(u.captured, m.to);
    }
}

// =============================================================================
//  Zobrist hash
// =============================================================================

uint64_t Position::calculate_hash() const {
    uint64_t h = 0;
    for (int sq = 0; sq < 64; ++sq) {
        Piece p = board[sq];
        if (p != EMPTY) h ^= Zobrist::piece_keys[p][sq];
    }
    if (side_to_move == BLACK) h ^= Zobrist::side_key;
    h ^= Zobrist::castle_keys[castling_rights & 0xF];
    if (ep_square >= 0) h ^= Zobrist::ep_keys[file_of(ep_square)];
    return h;
}

} // namespace NeuroEngine
