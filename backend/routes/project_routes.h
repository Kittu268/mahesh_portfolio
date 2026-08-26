#pragma once

#include "httplib.h"
#include "../database/database.h"

void setupProjectRoutes(
    httplib::Server& server,
    Database& database
);
