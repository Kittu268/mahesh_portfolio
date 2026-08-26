#include "certificate_database.h"
#include <sqlite3.h>
#include <iostream>

bool createCertificatesTable(Database& database)
{
    sqlite3* db = database.getConnection();

    const char* sql = R"(
        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        std::cerr << "Certificate table error: "
                  << errorMessage << std::endl;

        sqlite3_free(errorMessage);

        return false;
    }

    std::cout
        << "Certificates table initialized successfully."
        << std::endl;

    return true;
}
