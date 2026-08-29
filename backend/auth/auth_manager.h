#ifndef AUTH_MANAGER_H
#define AUTH_MANAGER_H

#include <string>

std::string createAuthToken();

bool isValidAuthToken(
    const std::string& token
);

#endif