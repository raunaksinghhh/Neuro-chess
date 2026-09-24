#!/bin/bash
set -e

cd "$(dirname "$0")"
echo "Compiling Neuro-Chess C++ Engine with Clang++ / G++..."
clang++ -std=c++17 -O3 -pthread src/zobrist.cpp src/position.cpp src/evaluation.cpp src/search.cpp src/server.cpp src/main.cpp -o neuro_engine_server
chmod +x neuro_engine_server
echo "Build complete! Binary created at backend/neuro_engine_server"
