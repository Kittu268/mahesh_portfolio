#include <iostream>
#include <cstdlib>
#include <string>
#include <filesystem>

#include "httplib.h"

#include "database/database.h"
#include "database/certificate_database.h"
#include "database/admin_database.h"

#include "routes/project_routes.h"
#include "routes/certificate_routes.h"
#include "routes/auth_routes.h"


namespace fs = std::filesystem;

static fs::path resolveAppRoot()
{
    fs::path current = fs::current_path();
    fs::path candidates[] = {
        current,
        current / "backend",
        current.parent_path(),
        current.parent_path() / "backend"
    };

    for (const auto& candidate : candidates)
    {
        if (
            fs::exists(candidate / "data") ||
            fs::exists(candidate / "uploads") ||
            fs::exists(candidate / "backend")
        )
        {
            return candidate;
        }
    }

    return current;
}

int main()
{
    // ==========================================
    // DATABASE
    // ==========================================

    fs::path appRoot = resolveAppRoot();
    fs::path databaseDirectory = appRoot / "data";
    fs::create_directories(databaseDirectory);

    const char* databaseEnvironment =
        std::getenv("DATABASE_PATH");

    std::string databasePath =
        databaseEnvironment != nullptr
            ? databaseEnvironment
            : (databaseDirectory / "portfolio.db").string();

    Database database(databasePath);


    if (!database.initialize())
    {
        std::cerr
            << "Failed to initialize database."
            << std::endl;

        return 1;
    }


    // ==========================================
    // CERTIFICATES TABLE
    // ==========================================

    if (!createCertificatesTable(database))
    {
        std::cerr
            << "Failed to initialize certificates table."
            << std::endl;

        return 1;
    }


    // ==========================================
    // ADMINS TABLE
    // ==========================================

    if (!createAdminsTable(database))
    {
        std::cerr
            << "Failed to initialize admins table."
            << std::endl;

        return 1;
    }


    // ==========================================
    // HTTP SERVER
    // ==========================================

    httplib::Server server;


    // ==========================================
    // CORS
    // ==========================================

    server.set_default_headers({

        {
            "Access-Control-Allow-Origin",
            "*"
        },

        {
            "Access-Control-Allow-Methods",
            "GET, POST, DELETE, OPTIONS"
        },

        {
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        }

    });


    // ==========================================
    // OPTIONS / CORS PREFLIGHT
    // ==========================================

    server.Options(
        R"(.*)",
        [](const httplib::Request&,
           httplib::Response& response)
        {
            response.status = 200;
        }
    );


   // ==========================================
// ROOT ROUTE
// ==========================================

server.Get(
    "/",
    [](const httplib::Request&,
       httplib::Response& response)
    {
        response.set_content(
            R"({
                "status":"success",
                "message":"Mahesh Bainoor Portfolio Backend is running",
                "service":"C++ + SQLite API"
            })",
            "application/json"
        );
    }
);


// ==========================================
// HEALTH CHECK
// ==========================================

server.Get(
    "/api/health",
    [](const httplib::Request&,
       httplib::Response& response)
    {
        response.set_content(
            R"({
                "status":"success",
                "message":"C++ backend is running"
            })",
            "application/json"
        );
    }
);

server.Get(
    "/",
    [](const httplib::Request&,
       httplib::Response& response)
    {
        response.set_content(
            R"({
                "status":"success",
                "message":"Mahesh Bainoor Portfolio Backend is running",
                "service":"C++ + SQLite API"
            })",
            "application/json"
        );
    }
);


    // ==========================================
    // PROJECT ROUTES
    // ==========================================

    setupProjectRoutes(
        server,
        database
    );


    // ==========================================
    // CERTIFICATE ROUTES
    // ==========================================

    setupCertificateRoutes(
        server,
        database
    );


    // ==========================================
    // AUTHENTICATION ROUTES
    // ==========================================

    setupAuthRoutes(
        server,
        database
    );


    // ==========================================
    // SERVE UPLOADED FILES
    // ==========================================

    /*
        IMPORTANT:

        Do NOT use:

        C:/Portfolio/backend/uploads

        because that path only exists on your PC.

        We use:

        uploads

        so it works locally and inside Docker.
    */

    fs::path uploadDirectory = appRoot / "uploads";
    fs::create_directories(uploadDirectory);

    if (
        !server.set_mount_point(
            "/uploads",
            uploadDirectory.string()
        )
    )
    {
        std::cerr
            << "Failed to mount uploads directory."
            << std::endl;
    }
    else
    {
        std::cout
            << "Uploads directory mounted successfully."
            << std::endl;
    }


    // ==========================================
    // GET PORT
    // ==========================================

    /*
        Local:

        PORT is normally not set,
        so we use 8080.

        Render:

        Render provides PORT automatically.
    */

    int port = 8080;


    const char* portEnvironment =
        std::getenv("PORT");


    if (portEnvironment != nullptr)
    {
        try
        {
            port =
                std::stoi(
                    portEnvironment
                );
        }
        catch (...)
        {
            std::cerr
                << "Invalid PORT environment variable."
                << std::endl;

            return 1;
        }
    }


    // ==========================================
    // SERVER INFORMATION
    // ==========================================

    std::cout
        << "====================================\n";

    std::cout
        << " Mahesh Bainoor Portfolio Backend\n";

    std::cout
        << " C++ + SQLite API\n";

    std::cout
        << " Port: "
        << port
        << "\n";

    std::cout
        << "====================================\n";


    // ==========================================
    // START SERVER
    // ==========================================

    if (
        !server.listen(
            "0.0.0.0",
            port
        )
    )
    {
        std::cerr
            << "Failed to start server."
            << std::endl;

        return 1;
    }


    return 0;
}