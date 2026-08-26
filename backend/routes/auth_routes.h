#ifndef AUTH_ROUTES_H
#define AUTH_ROUTES_H

#include "httplib.h"
#include "../database/database.h"

void setupAuthRoutes(
    httplib::Server& server,
    Database& database
);

#endif
