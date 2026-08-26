#pragma once

#include <sqlite3.h>
#include <string>

class Database {
public:
    Database(const std::string& databasePath);
    ~Database();

    bool initialize();
    sqlite3* getConnection();

private:
    sqlite3* db;
    std::string databasePath;
};
