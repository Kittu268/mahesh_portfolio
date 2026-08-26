#ifndef ADMIN_DATABASE_H
#define ADMIN_DATABASE_H

#include "database.h"

bool createAdminsTable(Database& database);

bool verifyAdmin(
    Database& database,
    const std::string& username,
    const std::string& password
);

#endif
