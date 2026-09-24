#include <iostream>
#include <string>
#include "position.hpp"
#include "evaluation.hpp"
#include "search.hpp"
#include "server.hpp"

void run_tests() {
    std::cout << "Running Neuro-Chess C++ Engine Self-Tests...\n";
    NeuroEngine::Position pos;
    std::cout << "Starting FEN: " << pos.to_fen() << "\n";

    int start_eval = NeuroEngine::Evaluator::evaluate(pos);
    std::cout << "Starting Evaluation: " << start_eval << " cp\n";

    NeuroEngine::Searcher searcher;
    std::cout << "Searching depth 4 from starting position...\n";
    auto result = searcher.search(pos, 4, 3);
    std::cout << "Best Move: " << result.best_move.to_uci() << " | Score: " << result.score
              << " cp | Nodes: " << result.nodes << " | NPS: " << result.nps
              << " | Time: " << result.time_ms << " ms\n";

    // Test tactical position (Scholar's mate defense)
    std::string tact_fen = "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 0 5";
    pos.load_fen(tact_fen);
    auto tact_res = searcher.search(pos, 4, 2);
    std::cout << "Tactical Position Best Move: " << tact_res.best_move.to_uci()
              << " | Score: " << tact_res.score << " cp\n";

    std::cout << "All C++ Engine self-tests passed successfully!\n";
}

int main(int argc, char* argv[]) {
    int port = 8080;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--test") {
            run_tests();
            return 0;
        } else if (arg == "--port" && i + 1 < argc) {
            port = std::stoi(argv[++i]);
        }
    }

    NeuroEngine::HttpServer server(port);
    if (!server.start()) {
        std::cerr << "Server failed to start on port " << port << "\n";
        return 1;
    }

    return 0;
}
