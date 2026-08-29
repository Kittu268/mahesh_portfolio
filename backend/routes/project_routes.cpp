#include "project_routes.h"

#include "../database/database.h"
#include "../auth/auth_manager.h"

#include "httplib.h"

#include <sqlite3.h>

#include <cstdlib>
#include <iostream>
#include <sstream>
#include <string>

// ==========================================================
// JSON ESCAPE
// ==========================================================

static std::string jsonEscape(const std::string& value)
{
    std::string result;

    for (char c : value)
    {
        switch (c)
        {
            case '"':
                result += "\\\"";
                break;

            case '\\':
                result += "\\\\";
                break;

            case '\n':
                result += "\\n";
                break;

            case '\r':
                result += "\\r";
                break;

            case '\t':
                result += "\\t";
                break;

            default:
                result += c;
                break;
        }
    }

    return result;
}


// ==========================================================
// GET /api/projects
// ==========================================================

void setupProjectRoutes(
    httplib::Server& server,
    Database& database
)
{

    // ======================================================
    // GET PROJECTS
    // ======================================================

    server.Get(
        "/api/projects",
        [&database](
            const httplib::Request&,
            httplib::Response& response
        )
        {
            sqlite3* db =
                database.getConnection();

            if (db == nullptr)
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Database connection failed"})",
                    "application/json"
                );

                return;
            }


            const char* sql =
                "SELECT "
                "id, "
                "name, "
                "description, "
                "github_url, "
                "technologies, "
                "image_path, "
                "created_at "
                "FROM projects "
                "ORDER BY id DESC;";


            sqlite3_stmt* statement =
                nullptr;


            if (
                sqlite3_prepare_v2(
                    db,
                    sql,
                    -1,
                    &statement,
                    nullptr
                ) != SQLITE_OK
            )
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Failed to read projects"})",
                    "application/json"
                );

                return;
            }


            std::ostringstream json;

            json << "[";

            bool first = true;


            while (
                sqlite3_step(statement)
                == SQLITE_ROW
            )
            {

                if (!first)
                {
                    json << ",";
                }

                first = false;


                int id =
                    sqlite3_column_int(
                        statement,
                        0
                    );


                const char* name =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            1
                        )
                    );


                const char* description =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            2
                        )
                    );


                const char* githubUrl =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            3
                        )
                    );


                const char* technologies =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            4
                        )
                    );


                const char* imagePath =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            5
                        )
                    );


                const char* createdAt =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            6
                        )
                    );


                json
                    << "{"

                    << "\"id\":"
                    << id

                    << ","

                    << "\"name\":\""
                    << jsonEscape(
                        name ? name : ""
                    )
                    << "\""

                    << ","

                    << "\"description\":\""
                    << jsonEscape(
                        description
                            ? description
                            : ""
                    )
                    << "\""

                    << ","

                    << "\"github_url\":\""
                    << jsonEscape(
                        githubUrl
                            ? githubUrl
                            : ""
                    )
                    << "\""

                    << ","

                    << "\"technologies\":\""
                    << jsonEscape(
                        technologies
                            ? technologies
                            : ""
                    )
                    << "\""

                    << ","

                    << "\"image_path\":\""
                    << jsonEscape(
                        imagePath
                            ? imagePath
                            : ""
                    )
                    << "\""

                    << ","

                    << "\"created_at\":\""
                    << jsonEscape(
                        createdAt
                            ? createdAt
                            : ""
                    )
                    << "\""

                    << "}";
            }


            json << "]";


            sqlite3_finalize(
                statement
            );


            response.set_content(
                json.str(),
                "application/json"
            );
        }
    );


    // ======================================================
    // POST /api/projects
    //
    // AUTHENTICATED
    //
    // The frontend uploads the image directly to Cloudinary.
    // It then sends the returned Cloudinary URL here.
    // ======================================================

    server.Post(
        "/api/projects",
        [&database](
            const httplib::Request& request,
            httplib::Response& response
        )
        {

            // ==================================================
            // AUTHENTICATION
            // ==================================================

            std::string token;


            if (
                request.has_header(
                    "Authorization"
                )
            )
            {

                const std::string header =
                    request.get_header_value(
                        "Authorization"
                    );


                const std::string prefix =
                    "Bearer ";


                if (
                    header.rfind(
                        prefix,
                        0
                    ) == 0
                )
                {

                    token =
                        header.substr(
                            prefix.length()
                        );
                }
            }


            if (token.empty())
            {
                response.status = 401;

                response.set_content(
                    R"({"status":"error","message":"Authentication required"})",
                    "application/json"
                );

                return;
            }


            // ==================================================
            // VALIDATE TOKEN
            // ==================================================

            if (
                !isValidAuthToken(
                    token
                )
            )
            {
                response.status = 401;

                response.set_content(
                    R"({"status":"error","message":"Invalid or expired token"})",
                    "application/json"
                );

                return;
            }


            // ==================================================
            // READ FORM PARAMETERS
            // ==================================================

            std::string name;
            std::string description;
            std::string githubUrl;
            std::string technologies;
            std::string imageUrl;


            if (
                request.has_param(
                    "name"
                )
            )
            {
                name =
                    request.get_param_value(
                        "name"
                    );
            }


            if (
                request.has_param(
                    "description"
                )
            )
            {
                description =
                    request.get_param_value(
                        "description"
                    );
            }


            if (
                request.has_param(
                    "github_url"
                )
            )
            {
                githubUrl =
                    request.get_param_value(
                        "github_url"
                    );
            }


            if (
                request.has_param(
                    "technologies"
                )
            )
            {
                technologies =
                    request.get_param_value(
                        "technologies"
                    );
            }


            if (
                request.has_param(
                    "image_url"
                )
            )
            {
                imageUrl =
                    request.get_param_value(
                        "image_url"
                    );
            }


            // ==================================================
            // VALIDATE PROJECT NAME
            // ==================================================

            if (name.empty())
            {
                response.status = 400;

                response.set_content(
                    R"({"status":"error","message":"Project name is required"})",
                    "application/json"
                );

                return;
            }


            // ==================================================
            // DATABASE
            // ==================================================

            sqlite3* db =
                database.getConnection();


            if (db == nullptr)
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Database connection failed"})",
                    "application/json"
                );

                return;
            }


            // ==================================================
            // INSERT PROJECT
            // ==================================================

            const char* sql =
                "INSERT INTO projects "
                "(name, description, github_url, technologies, image_path) "
                "VALUES (?, ?, ?, ?, ?);";


            sqlite3_stmt* statement =
                nullptr;


            if (
                sqlite3_prepare_v2(
                    db,
                    sql,
                    -1,
                    &statement,
                    nullptr
                ) != SQLITE_OK
            )
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Failed to prepare project insert"})",
                    "application/json"
                );

                return;
            }


            sqlite3_bind_text(
                statement,
                1,
                name.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            sqlite3_bind_text(
                statement,
                2,
                description.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            sqlite3_bind_text(
                statement,
                3,
                githubUrl.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            sqlite3_bind_text(
                statement,
                4,
                technologies.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            sqlite3_bind_text(
                statement,
                5,
                imageUrl.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            if (
                sqlite3_step(statement)
                != SQLITE_DONE
            )
            {

                sqlite3_finalize(
                    statement
                );


                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Failed to add project"})",
                    "application/json"
                );

                return;
            }


            int projectId =
                static_cast<int>(
                    sqlite3_last_insert_rowid(
                        db
                    )
                );


            sqlite3_finalize(
                statement
            );


            // ==================================================
            // SUCCESS
            // ==================================================

            std::ostringstream json;


            json
                << "{"
                << "\"status\":\"success\","
                << "\"message\":\"Project added successfully\","
                << "\"id\":"
                << projectId
                << "}";


            response.set_content(
                json.str(),
                "application/json"
            );
        }
    );


    // ======================================================
    // DELETE /api/projects/<id>
    //
    // AUTHENTICATED
    // ======================================================

    server.Delete(
        R"(/api/projects/(\d+))",
        [&database](
            const httplib::Request& request,
            httplib::Response& response
        )
        {

            // ==================================================
            // AUTHENTICATION
            // ==================================================

            std::string token;


            if (
                request.has_header(
                    "Authorization"
                )
            )
            {

                const std::string header =
                    request.get_header_value(
                        "Authorization"
                    );


                const std::string prefix =
                    "Bearer ";


                if (
                    header.rfind(
                        prefix,
                        0
                    ) == 0
                )
                {

                    token =
                        header.substr(
                            prefix.length()
                        );
                }
            }


            if (token.empty())
            {
                response.status = 401;

                response.set_content(
                    R"({"status":"error","message":"Authentication required"})",
                    "application/json"
                );

                return;
            }


            // ==================================================
            // VALIDATE TOKEN
            // ==================================================

            if (
                !isValidAuthToken(
                    token
                )
            )
            {
                response.status = 401;

                response.set_content(
                    R"({"status":"error","message":"Invalid or expired token"})",
                    "application/json"
                );

                return;
            }


            // ==================================================
            // PROJECT ID
            // ==================================================

            int projectId =
                std::stoi(
                    request.matches[1]
                );


            // ==================================================
            // DATABASE
            // ==================================================

            sqlite3* db =
                database.getConnection();


            if (db == nullptr)
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Database connection failed"})",
                    "application/json"
                );

                return;
            }


            // ==================================================
            // DELETE PROJECT
            // ==================================================

            const char* sql =
                "DELETE FROM projects "
                "WHERE id = ?;";


            sqlite3_stmt* statement =
                nullptr;


            if (
                sqlite3_prepare_v2(
                    db,
                    sql,
                    -1,
                    &statement,
                    nullptr
                ) != SQLITE_OK
            )
            {

                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Failed to prepare delete"})",
                    "application/json"
                );

                return;
            }


            sqlite3_bind_int(
                statement,
                1,
                projectId
            );


            if (
                sqlite3_step(statement)
                != SQLITE_DONE
            )
            {

                sqlite3_finalize(
                    statement
                );


                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Failed to delete project"})",
                    "application/json"
                );

                return;
            }


            int deleted =
                sqlite3_changes(
                    db
                );


            sqlite3_finalize(
                statement
            );


            if (deleted == 0)
            {
                response.status = 404;

                response.set_content(
                    R"({"status":"error","message":"Project not found"})",
                    "application/json"
                );

                return;
            }


            response.set_content(
                R"({"status":"success","message":"Project deleted successfully"})",
                "application/json"
            );
        }
    );
}