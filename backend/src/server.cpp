#include "server.hpp"
#include <iostream>
#include <sstream>
#include <vector>
#include <thread>
#include <cstring>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

namespace NeuroEngine {

static std::string extract_json_string(const std::string& json, const std::string& key) {
    std::string needle = "\"" + key + "\":";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) {
        needle = "\"" + key + "\" :";
        pos = json.find(needle);
        if (pos == std::string::npos) return "";
    }
    pos += needle.length();
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == '\t' || json[pos] == '\"')) pos++;
    size_t end_pos = json.find('\"', pos);
    if (end_pos == std::string::npos) return "";
    return json.substr(pos, end_pos - pos);
}

static int extract_json_int(const std::string& json, const std::string& key, int default_val = 0) {
    std::string needle = "\"" + key + "\":";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) {
        needle = "\"" + key + "\" :";
        pos = json.find(needle);
        if (pos == std::string::npos) return default_val;
    }
    pos += needle.length();
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == '\t')) pos++;
    try {
        return std::stoi(json.substr(pos));
    } catch (...) {
        return default_val;
    }
}

HttpServer::~HttpServer() {
    stop();
}

void HttpServer::stop() {
    is_running = false;
    if (server_fd >= 0) {
        close(server_fd);
        server_fd = -1;
    }
}

bool HttpServer::start() {
    server_fd = socket(AF_INET6, SOCK_STREAM, 0);
    bool is_ipv6 = true;
    if (server_fd < 0) {
        server_fd = socket(AF_INET, SOCK_STREAM, 0);
        is_ipv6 = false;
        if (server_fd < 0) {
            std::cerr << "Failed to create socket\n";
            return false;
        }
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    if (is_ipv6) {
        int v6only = 0;
        setsockopt(server_fd, IPPROTO_IPV6, IPV6_V6ONLY, &v6only, sizeof(v6only));
        sockaddr_in6 address{};
        address.sin6_family = AF_INET6;
        address.sin6_addr = in6addr_any;
        address.sin6_port = htons(port);

        if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
            std::cerr << "Failed to bind dual-stack socket, falling back to IPv4...\n";
            close(server_fd);
            server_fd = socket(AF_INET, SOCK_STREAM, 0);
            if (server_fd >= 0) {
                setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
                sockaddr_in addr4{};
                addr4.sin_family = AF_INET;
                addr4.sin_addr.s_addr = INADDR_ANY;
                addr4.sin_port = htons(port);
                if (bind(server_fd, (struct sockaddr*)&addr4, sizeof(addr4)) < 0) {
                    std::cerr << "Failed to bind socket to port " << port << "\n";
                    close(server_fd);
                    server_fd = -1;
                    return false;
                }
            }
        }
    } else {
        sockaddr_in address{};
        address.sin_family = AF_INET;
        address.sin_addr.s_addr = INADDR_ANY;
        address.sin_port = htons(port);
        if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
            std::cerr << "Failed to bind socket to port " << port << "\n";
            close(server_fd);
            server_fd = -1;
            return false;
        }
    }

    if (listen(server_fd, 64) < 0) {
        std::cerr << "Failed to listen on socket\n";
        close(server_fd);
        server_fd = -1;
        return false;
    }

    is_running = true;
    std::cout << "========================================================\n";
    std::cout << "  ⚡ Neuro-Chess C++ Engine Server Active on Port " << port << "\n";
    std::cout << "  🚀 Endpoints: /eval, /move, /health (IPv4 & IPv6)\n";
    std::cout << "========================================================\n";

    while (is_running) {
        sockaddr_storage client_addr{};
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(server_fd, (struct sockaddr*)&client_addr, &client_len);
        if (client_fd < 0) {
            if (!is_running) break;
            continue;
        }

        std::thread([this, client_fd]() {
            handle_client(client_fd);
        }).detach();
    }

    return true;
}

void HttpServer::handle_client(int client_fd) {
    std::vector<char> buffer(65536, 0);
    ssize_t bytes_read = read(client_fd, buffer.data(), buffer.size() - 1);
    if (bytes_read <= 0) {
        close(client_fd);
        return;
    }

    std::string req(buffer.data(), bytes_read);
    std::istringstream req_stream(req);
    std::string method, path, version;
    req_stream >> method >> path >> version;

    if (method == "OPTIONS") {
        std::string res = "HTTP/1.1 204 No Content\r\n"
                          "Access-Control-Allow-Origin: *\r\n"
                          "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
                          "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
                          "Content-Length: 0\r\n\r\n";
        write(client_fd, res.c_str(), res.length());
        close(client_fd);
        return;
    }

    // Find body after \r\n\r\n
    std::string body = "";
    size_t body_pos = req.find("\r\n\r\n");
    if (body_pos != std::string::npos) {
        body = req.substr(body_pos + 4);
    }

    std::string json_response = process_request(method, path, body);

    std::ostringstream res;
    res << "HTTP/1.1 200 OK\r\n";
    res << "Content-Type: application/json\r\n";
    res << "Access-Control-Allow-Origin: *\r\n";
    res << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
    res << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
    res << "Content-Length: " << json_response.length() << "\r\n\r\n";
    res << json_response;

    std::string res_str = res.str();
    write(client_fd, res_str.c_str(), res_str.length());
    close(client_fd);
}

std::string HttpServer::process_request(const std::string& method, const std::string& path, const std::string& body) {
    if (path == "/health") {
        return "{\"status\":\"ok\",\"engine\":\"Neuro-Chess C++ Core v2.0\",\"author\":\"Google Deepmind / Antigravity\"}";
    }

    if (path == "/eval" || path == "/move") {
        std::string fen = extract_json_string(body, "fen");
        if (fen.empty()) {
            fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        }
        int depth = extract_json_int(body, "depth", 4);
        depth = std::max(1, std::min(6, depth)); // Clamp depth

        Position pos;
        pos.load_fen(fen);

        EvalResult detailed_eval = Evaluator::evaluate_detailed(pos);
        SearchResult res = searcher.search(pos, depth, 3);

        std::ostringstream json;
        json << "{\n";
        json << "  \"engine\": \"C++ Neuro-Core\",\n";
        json << "  \"score\": " << res.score << ",\n";
        json << "  \"best_move\": \"" << res.best_move.to_uci() << "\",\n";
        json << "  \"from\": \"" << square_to_str(res.best_move.from) << "\",\n";
        json << "  \"to\": \"" << square_to_str(res.best_move.to) << "\",\n";
        json << "  \"depth\": " << res.depth << ",\n";
        json << "  \"nodes\": " << res.nodes << ",\n";
        json << "  \"nps\": " << res.nps << ",\n";
        json << "  \"time_ms\": " << res.time_ms << ",\n";

        // Multi-PV Lines
        json << "  \"lines\": [\n";
        for (size_t i = 0; i < res.lines.size(); ++i) {
            const auto& line = res.lines[i];
            json << "    {\n";
            json << "      \"uci\": \"" << line.uci << "\",\n";
            json << "      \"from\": \"" << square_to_str(line.move.from) << "\",\n";
            json << "      \"to\": \"" << square_to_str(line.move.to) << "\",\n";
            json << "      \"score\": " << line.score << ",\n";
            json << "      \"depth\": " << line.depth << "\n";
            json << "    }" << (i + 1 < res.lines.size() ? "," : "") << "\n";
        }
        json << "  ],\n";

        // Heatmap Matrix
        json << "  \"heatmap\": [\n";
        for (int r = 0; r < 8; ++r) {
            json << "    [";
            for (int c = 0; c < 8; ++c) {
                json << detailed_eval.heatmap[r][c] << (c < 7 ? ", " : "");
            }
            json << "]" << (r < 7 ? "," : "") << "\n";
        }
        json << "  ],\n";

        // Attacked Squares List
        json << "  \"attacked_squares\": [";
        for (size_t i = 0; i < detailed_eval.attacked_squares.size(); ++i) {
            json << "\"" << detailed_eval.attacked_squares[i] << "\"" << (i + 1 < detailed_eval.attacked_squares.size() ? ", " : "");
        }
        json << "]\n";
        json << "}";

        return json.str();
    }

    return "{\"error\":\"Not found\"}";
}

} // namespace NeuroEngine
