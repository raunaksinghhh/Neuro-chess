#pragma once
#include <string>
#include <atomic>
#include <mutex>
#include "position.hpp"
#include "search.hpp"

namespace NeuroEngine {

class HttpServer {
private:
    int port = 8080;
    int server_fd = -1;
    std::atomic<bool> is_running{false};
    Searcher searcher;
    std::mutex search_mutex;

    void handle_client(int client_fd);
    std::string process_request(const std::string& method, const std::string& path, const std::string& body);

public:
    HttpServer(int p = 8080) : port(p) {}
    ~HttpServer();

    bool start();
    void stop();
};

} // namespace NeuroEngine
