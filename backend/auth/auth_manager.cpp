#include "auth_manager.h"

#include <random>
#include <sstream>
#include <iomanip>
#include <unordered_set>
#include <mutex>

namespace
{
    std::unordered_set<std::string> validTokens;
    std::mutex tokenMutex;
}

std::string createAuthToken()
{
    std::random_device randomDevice;

    std::mt19937 generator(
        randomDevice()
    );

    std::uniform_int_distribution<unsigned int>
        distribution(0, 255);

    std::ostringstream token;

    for (int i = 0; i < 32; ++i)
    {
        token
            << std::hex
            << std::setw(2)
            << std::setfill('0')
            << distribution(generator);
    }

    std::string result = token.str();

    {
        std::lock_guard<std::mutex> lock(
            tokenMutex
        );

        validTokens.insert(result);
    }

    return result;
}

bool isValidAuthToken(
    const std::string& token
)
{
    if (token.empty())
        return false;

    std::lock_guard<std::mutex> lock(
        tokenMutex
    );

    return validTokens.find(token)
        != validTokens.end();
}
