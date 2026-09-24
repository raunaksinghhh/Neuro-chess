#include "zobrist.hpp"

namespace NeuroEngine {

namespace Zobrist {
    uint64_t piece_keys[13][64];
    uint64_t side_key;
    uint64_t castle_keys[16];
    extern uint64_t ep_keys[8];
    uint64_t ep_keys[8];

    // Simple deterministic PRNG for reproducible Zobrist keys
    static uint64_t prng_state = 1804289383ULL;
    static uint64_t rand64() {
        prng_state ^= prng_state >> 12;
        prng_state ^= prng_state << 25;
        prng_state ^= prng_state >> 27;
        return prng_state * 2685821657736338717ULL;
    }

    void init() {
        for (int p = 0; p < 13; ++p) {
            for (int sq = 0; sq < 64; ++sq) {
                piece_keys[p][sq] = rand64();
            }
        }
        side_key = rand64();
        for (int c = 0; c < 16; ++c) {
            castle_keys[c] = rand64();
        }
        for (int f = 0; f < 8; ++f) {
            ep_keys[f] = rand64();
        }
    }
}

} // namespace NeuroEngine
