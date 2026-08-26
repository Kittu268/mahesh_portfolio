#include "database.h"

#include <iostream>
#include <string>


// ======================================================
// DATABASE CONSTRUCTOR
// ======================================================

Database::Database(const std::string& path)
    : db(nullptr),
      databasePath(path) {
}


// ======================================================
// DATABASE DESTRUCTOR
// ======================================================

Database::~Database() {

    if (db) {
        sqlite3_close(db);
    }

}


// ======================================================
// INITIALIZE DATABASE
// ======================================================

bool Database::initialize() {

    // --------------------------------------------------
    // Open SQLite database
    // --------------------------------------------------

    if (
        sqlite3_open(
            databasePath.c_str(),
            &db
        ) != SQLITE_OK
    ) {

        std::cerr
            << "Database error: "
            << sqlite3_errmsg(db)
            << std::endl;

        return false;
    }


    // ==================================================
    // CREATE PROJECTS TABLE
    // ==================================================

    const char* createProjectsTable = R"(
        CREATE TABLE IF NOT EXISTS projects (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            description TEXT NOT NULL,

            github_url TEXT,

            technologies TEXT,

            image_path TEXT,

            created_at DATETIME
                DEFAULT CURRENT_TIMESTAMP
        );
    )";


    char* errorMessage = nullptr;


    int result =
        sqlite3_exec(
            db,
            createProjectsTable,
            nullptr,
            nullptr,
            &errorMessage
        );


    if (result != SQLITE_OK) {

        std::cerr
            << "Projects table creation error: "
            << errorMessage
            << std::endl;

        sqlite3_free(errorMessage);

        return false;
    }


    // ==================================================
    // ADD TECHNOLOGIES COLUMN
    // ==================================================
    //
    // This is needed because your existing database
    // was created before the technologies column existed.
    //
    // SQLite returns an error if the column already exists.
    // We intentionally ignore that error.
    //

    sqlite3_exec(
        db,
        "ALTER TABLE projects "
        "ADD COLUMN technologies TEXT;",
        nullptr,
        nullptr,
        nullptr
    );


    // ==================================================
    // ADD IMAGE PATH COLUMN
    // ==================================================

    sqlite3_exec(
        db,
        "ALTER TABLE projects "
        "ADD COLUMN image_path TEXT;",
        nullptr,
        nullptr,
        nullptr
    );


    // ==================================================
    // DATABASE INITIALIZED
    // ==================================================

    std::cout
        << "SQLite database initialized successfully."
        << std::endl;


    return true;
}


// ======================================================
// GET DATABASE CONNECTION
// ======================================================

sqlite3* Database::getConnection() {

    return db;
}