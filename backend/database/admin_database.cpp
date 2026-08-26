#include "admin_database.h"

#include <sqlite3.h>
#include <iostream>
#include <string>

bool createAdminsTable(Database& database)
{
    sqlite3* db = database.getConnection();

    const char* sql = R"(
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    )";

    char* errorMessage = nullptr;

    int result = sqlite3_exec(
        db,
        sql,
        nullptr,
        nullptr,
        &errorMessage
    );

    if (result != SQLITE_OK)
    {
        std::cerr
            << "Admin table error: "
            << errorMessage
            << std::endl;

        sqlite3_free(errorMessage);

        return false;
    }

    // Create default admin if no admin exists.
    const char* insertSql = R"(
        INSERT INTO admins (username, password)
        SELECT 'admin', 'admin123'
        WHERE NOT EXISTS (
            SELECT 1 FROM admins
        );
    )";

    result = sqlite3_exec(
        db,
        insertSql,
        nullptr,
        nullptr,
        &errorMessage
    );

    if (result != SQLITE_OK)
    {
        std::cerr
            << "Default admin error: "
            << errorMessage
            << std::endl;

        sqlite3_free(errorMessage);

        return false;
    }

    std::cout
        << "Admins table initialized successfully."
        << std::endl;

    return true;
}


bool verifyAdmin(
    Database& database,
    const std::string& username,
    const std::string& password
)
{
    sqlite3* db = database.getConnection();

    const char* sql =
        "SELECT id "
        "FROM admins "
        "WHERE username = ? "
        "AND password = ? "
        "LIMIT 1;";

    sqlite3_stmt* statement = nullptr;

    if (sqlite3_prepare_v2(
            db,
            sql,
            -1,
            &statement,
            nullptr
        ) != SQLITE_OK)
    {
        return false;
    }

    sqlite3_bind_text(
        statement,
        1,
        username.c_str(),
        -1,
        SQLITE_TRANSIENT
    );

    sqlite3_bind_text(
        statement,
        2,
        password.c_str(),
        -1,
        SQLITE_TRANSIENT
    );

    bool valid =
        sqlite3_step(statement) == SQLITE_ROW;

    sqlite3_finalize(statement);

    return valid;
}
