#pragma once
#include <cstdint>
#include "chess_types.hpp"

namespace NeuroEngine {

namespace Zobrist {
    extern uint64_t piece_keys[13][64];
    extern uint64_t side_key;
    extern uint64_t castle_keys[16];
    extern uint64_t ep_keys[8];

    void init();
}

} // namespace NeuroEngine
