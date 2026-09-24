CXX = clang++
CXXFLAGS = -std=c++17 -O3 -Wall -Wextra -pthread
SRC = src/zobrist.cpp src/position.cpp src/evaluation.cpp src/search.cpp src/server.cpp src/main.cpp
TARGET = neuro_engine_server

all: $(TARGET)

$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET)

clean:
	rm -f $(TARGET)

.PHONY: all clean
