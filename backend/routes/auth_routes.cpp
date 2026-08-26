#include "auth_routes.h"

#include "../database/admin_database.h"
#include "../auth/auth_manager.h"

#include <string>

void setupAuthRoutes(
    httplib::Server& server,
    Database& database
)
{
    server.Post(
        "/api/login",
        [&database](
            const httplib::Request& request,
            httplib::Response& response
        )
        {
            std::string username;
            std::string password;

            if (request.has_param("username"))
            {
                username =
                    request.get_param_value("username");
            }

            if (request.has_param("password"))
            {
                password =
                    request.get_param_value("password");
            }

            if (username.empty() ||
                password.empty())
            {
                response.status = 400;

                response.set_content(
                    R"({"status":"error","message":"Username and password are required"})",
                    "application/json"
                );

                return;
            }

            if (!verifyAdmin(
                    database,
                    username,
                    password))
            {
                response.status = 401;

                response.set_content(
                    R"({"status":"error","message":"Invalid username or password"})",
                    "application/json"
                );

                return;
            }

            std::string token =
                createAuthToken();

            response.set_content(
                "{\"status\":\"success\","
                "\"message\":\"Login successful\","
                "\"token\":\"" +
                token +
                "\"}",
                "application/json"
            );
        }
    );
}
