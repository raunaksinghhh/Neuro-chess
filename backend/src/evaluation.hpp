#pragma once
#include "position.hpp"
#include <vector>

namespace NeuroEngine {

struct EvalResult {
    int score = 0; // In centipawns (+ for White, - for Black)
    std::vector<std::vector<float>> heatmap; // 8x8 square control
    std::vector<std::string> attacked_squares;
};

class Evaluator {
public:
    static int evaluate(const Position& pos);
    static EvalResult evaluate_detailed(const Position& pos);
};

} // namespace NeuroEngine
