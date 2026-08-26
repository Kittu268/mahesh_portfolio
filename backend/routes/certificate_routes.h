#pragma once

#include "httplib.h"
#include "../database/database.h"

void setupCertificateRoutes(
    httplib::Server& server,
    Database& database
);
