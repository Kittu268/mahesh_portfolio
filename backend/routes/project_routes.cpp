#include "../auth/auth_manager.h"
#include "project_routes.h"

#include <sqlite3.h>

#include <string>
#include <fstream>
#include <filesystem>
#include <algorithm>
#include <cctype>
#include <ctime>
#include <iostream>

namespace fs = std::filesystem;


// ==========================================================
// PROJECT UPLOAD DIRECTORY
// ==========================================================
//
// IMPORTANT:
//
// The backend executable is being run from:
//
// C:\Portfolio\backend\build
//
// Therefore we use the absolute backend upload directory:
//
// C:\Portfolio\backend\uploads\projects
//
// The database will still store only:
//
// uploads/projects/project_xxxxx.jpg
//
// ==========================================================

const fs::path PROJECT_UPLOAD_DIRECTORY =
    fs::path("C:/Portfolio/backend/uploads/projects");


// ==========================================================
// JSON ESCAPE HELPER
// ==========================================================

std::string escapeJson(
    const std::string& value
)
{
    std::string result;

    for (char c : value)
    {
        switch (c)
        {
            case '\"':
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
// AUTHENTICATION
// ==========================================================

bool checkProjectAuthentication(
    const httplib::Request& request,
    httplib::Response& response
)
{
    const std::string authHeader =
        request.get_header_value(
            "Authorization"
        );


    if (
        authHeader.rfind(
            "Bearer ",
            0
        ) != 0
        ||
        !isValidAuthToken(
            authHeader.substr(7)
        )
    )
    {
        response.status = 401;

        response.set_content(
            R"({"status":"error","message":"Authentication required"})",
            "application/json"
        );

        return false;
    }


    return true;
}


// ==========================================================
// IMAGE EXTENSION VALIDATION
// ==========================================================

bool isAllowedImageExtension(
    const std::string& extension
)
{
    std::string ext =
        extension;


    std::transform(
        ext.begin(),
        ext.end(),
        ext.begin(),
        [](unsigned char c)
        {
            return static_cast<char>(
                std::tolower(c)
            );
        }
    );


    return
        ext == ".jpg" ||
        ext == ".jpeg" ||
        ext == ".png" ||
        ext == ".webp";
}


// ==========================================================
// PROJECT ROUTES
// ==========================================================

void setupProjectRoutes(
    httplib::Server& server,
    Database& database
)
{

    // ======================================================
    // GET /api/projects
    // PUBLIC
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
                    R"({"status":"error","message":"Database query failed"})",
                    "application/json"
                );

                return;
            }


            std::string json =
                "[";


            bool first =
                true;


            while (
                sqlite3_step(statement)
                == SQLITE_ROW
            )
            {

                if (!first)
                    json += ",";


                first =
                    false;


                // ------------------------------------------
                // ID
                // ------------------------------------------

                int id =
                    sqlite3_column_int(
                        statement,
                        0
                    );


                // ------------------------------------------
                // NAME
                // ------------------------------------------

                const char* name =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            1
                        )
                    );


                // ------------------------------------------
                // DESCRIPTION
                // ------------------------------------------

                const char* description =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            2
                        )
                    );


                // ------------------------------------------
                // GITHUB
                // ------------------------------------------

                const char* github =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            3
                        )
                    );


                // ------------------------------------------
                // TECHNOLOGIES
                // ------------------------------------------

                const char* technologies =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            4
                        )
                    );


                // ------------------------------------------
                // IMAGE PATH
                // ------------------------------------------

                const char* imagePath =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            5
                        )
                    );


                // ------------------------------------------
                // CREATED DATE
                // ------------------------------------------

                const char* created =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            6
                        )
                    );


                // ------------------------------------------
                // JSON
                // ------------------------------------------

                json += "{";


                json +=
                    "\"id\":" +
                    std::to_string(id) +
                    ",";


                json +=
                    "\"name\":\"" +
                    escapeJson(
                        name
                            ? name
                            : ""
                    ) +
                    "\",";


                json +=
                    "\"description\":\"" +
                    escapeJson(
                        description
                            ? description
                            : ""
                    ) +
                    "\",";


                json +=
                    "\"github_url\":\"" +
                    escapeJson(
                        github
                            ? github
                            : ""
                    ) +
                    "\",";


                json +=
                    "\"technologies\":\"" +
                    escapeJson(
                        technologies
                            ? technologies
                            : ""
                    ) +
                    "\",";


                json +=
                    "\"image_path\":\"" +
                    escapeJson(
                        imagePath
                            ? imagePath
                            : ""
                    ) +
                    "\",";


                json +=
                    "\"created_at\":\"" +
                    escapeJson(
                        created
                            ? created
                            : ""
                    ) +
                    "\"";


                json +=
                    "}";
            }


            json +=
                "]";


            sqlite3_finalize(
                statement
            );


            response.set_content(
                json,
                "application/json"
            );

        }
    );


    // ======================================================
    // POST /api/projects
    //
    // AUTHENTICATED
    //
    // multipart/form-data
    //
    // Fields:
    // name
    // description
    // github_url
    // technologies
    // image
    // ======================================================

    server.Post(
        "/api/projects",
        [&database](
            const httplib::Request& request,
            httplib::Response& response
        )
        {

            // ----------------------------------------------
            // AUTHENTICATION
            // ----------------------------------------------

            if (
                !checkProjectAuthentication(
                    request,
                    response
                )
            )
            {
                return;
            }


            // ----------------------------------------------
            // FORM VALUES
            // ----------------------------------------------

            std::string name =
                request.form.get_field(
                    "name"
                );


            std::string description =
                request.form.get_field(
                    "description"
                );


            std::string githubUrl =
                request.form.get_field(
                    "github_url"
                );


            std::string technologies =
                request.form.get_field(
                    "technologies"
                );


            std::string imagePath;


            // ----------------------------------------------
            // SUPPORT NORMAL FORM PARAMETERS TOO
            // ----------------------------------------------

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


            // ----------------------------------------------
            // VALIDATION
            // ----------------------------------------------

            if (
                name.empty() ||
                description.empty()
            )
            {
                response.status = 400;

                response.set_content(
                    R"({"status":"error","message":"Name and description are required"})",
                    "application/json"
                );

                return;
            }


            // ==================================================
            // IMAGE UPLOAD
            // ==================================================

            if (
                request.is_multipart_form_data()
            )
            {

                if (
                    request.form.has_file(
                        "image"
                    )
                )
                {

                    const auto& image =
                        request.form.get_file(
                            "image"
                        );


                    // ------------------------------------------
                    // GET EXTENSION
                    // ------------------------------------------

                    std::string extension =
                        fs::path(
                            image.filename
                        ).extension().string();


                    // ------------------------------------------
                    // VALIDATE EXTENSION
                    // ------------------------------------------

                    if (
                        !isAllowedImageExtension(
                            extension
                        )
                    )
                    {
                        response.status = 400;

                        response.set_content(
                            R"({"status":"error","message":"Only JPG, JPEG, PNG and WEBP images are allowed"})",
                            "application/json"
                        );

                        return;
                    }


                    // ------------------------------------------
                    // CREATE UPLOAD DIRECTORY
                    // ------------------------------------------

                    fs::path uploadDirectory =
                        PROJECT_UPLOAD_DIRECTORY;


                    std::error_code directoryError;


                    fs::create_directories(
                        uploadDirectory,
                        directoryError
                    );


                    if (
                        directoryError
                    )
                    {
                        std::cerr
                            << "Upload directory error: "
                            << directoryError.message()
                            << std::endl;


                        response.status = 500;

                        response.set_content(
                            R"({"status":"error","message":"Unable to create project upload directory"})",
                            "application/json"
                        );

                        return;
                    }


                    // ------------------------------------------
                    // UNIQUE FILE NAME
                    // ------------------------------------------

                    std::string filename =
                        "project_" +
                        std::to_string(
                            std::time(
                                nullptr
                            )
                        ) +
                        extension;


                    fs::path outputPath =
                        uploadDirectory /
                        filename;


                    // ------------------------------------------
                    // SAVE IMAGE
                    // ------------------------------------------

                    std::ofstream outputFile(
                        outputPath,
                        std::ios::binary
                    );


                    if (!outputFile)
                    {
                        response.status = 500;

                        response.set_content(
                            R"({"status":"error","message":"Unable to save project image"})",
                            "application/json"
                        );

                        return;
                    }


                    outputFile.write(
                        image.content.data(),
                        static_cast<std::streamsize>(
                            image.content.size()
                        )
                    );


                    outputFile.close();


                    if (!outputFile)
                    {
                        response.status = 500;

                        response.set_content(
                            R"({"status":"error","message":"Failed while saving project image"})",
                            "application/json"
                        );

                        return;
                    }


                    // ------------------------------------------
                    // DATABASE PATH
                    // ------------------------------------------
                    //
                    // Keep database path relative.
                    //
                    // Example:
                    //
                    // uploads/projects/project_123.jpg
                    //
                    // ------------------------------------------

                    imagePath =
                        (
                            fs::path(
                                "uploads"
                            ) /
                            "projects" /
                            filename
                        ).generic_string();


                    std::cout
                        << "Project image saved: "
                        << outputPath
                        << std::endl;

                }
            }


            // ==================================================
            // DATABASE
            // ==================================================

            sqlite3* db =
                database.getConnection();


            const char* sql =
                "INSERT INTO projects "
                "(name, description, github_url, "
                "technologies, image_path) "
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
                    R"({"status":"error","message":"Failed to prepare database query"})",
                    "application/json"
                );

                return;
            }


            // ----------------------------------------------
            // BIND NAME
            // ----------------------------------------------

            sqlite3_bind_text(
                statement,
                1,
                name.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            // ----------------------------------------------
            // BIND DESCRIPTION
            // ----------------------------------------------

            sqlite3_bind_text(
                statement,
                2,
                description.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            // ----------------------------------------------
            // BIND GITHUB
            // ----------------------------------------------

            sqlite3_bind_text(
                statement,
                3,
                githubUrl.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            // ----------------------------------------------
            // BIND TECHNOLOGIES
            // ----------------------------------------------

            sqlite3_bind_text(
                statement,
                4,
                technologies.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            // ----------------------------------------------
            // BIND IMAGE PATH
            // ----------------------------------------------

            sqlite3_bind_text(
                statement,
                5,
                imagePath.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            // ----------------------------------------------
            // INSERT
            // ----------------------------------------------

            if (
                sqlite3_step(
                    statement
                ) != SQLITE_DONE
            )
            {

                sqlite3_finalize(
                    statement
                );

                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Failed to insert project"})",
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


            // ----------------------------------------------
            // SUCCESS
            // ----------------------------------------------

            response.set_content(
                "{\"status\":\"success\","
                "\"message\":\"Project added successfully\","
                "\"id\":" +
                std::to_string(
                    projectId
                ) +
                "}",
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

            // ----------------------------------------------
            // AUTHENTICATION
            // ----------------------------------------------

            if (
                !checkProjectAuthentication(
                    request,
                    response
                )
            )
            {
                return;
            }


            // ----------------------------------------------
            // PROJECT ID
            // ----------------------------------------------

            int id =
                std::stoi(
                    request.matches[1].str()
                );


            sqlite3* db =
                database.getConnection();


            // ----------------------------------------------
            // GET IMAGE PATH BEFORE DELETE
            // ----------------------------------------------

            std::string imagePath;


            const char* selectSql =
                "SELECT image_path "
                "FROM projects "
                "WHERE id = ?;";


            sqlite3_stmt* selectStatement =
                nullptr;


            if (
                sqlite3_prepare_v2(
                    db,
                    selectSql,
                    -1,
                    &selectStatement,
                    nullptr
                ) == SQLITE_OK
            )
            {

                sqlite3_bind_int(
                    selectStatement,
                    1,
                    id
                );


                if (
                    sqlite3_step(
                        selectStatement
                    ) == SQLITE_ROW
                )
                {

                    const char* path =
                        reinterpret_cast<const char*>(
                            sqlite3_column_text(
                                selectStatement,
                                0
                            )
                        );


                    if (path)
                    {
                        imagePath =
                            path;
                    }

                }


                sqlite3_finalize(
                    selectStatement
                );
            }


            // ----------------------------------------------
            // DELETE DATABASE RECORD
            // ----------------------------------------------

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
                    R"({"status":"error","message":"Database query failed"})",
                    "application/json"
                );

                return;
            }


            sqlite3_bind_int(
                statement,
                1,
                id
            );


            if (
                sqlite3_step(
                    statement
                ) != SQLITE_DONE
            )
            {

                sqlite3_finalize(
                    statement
                );

                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Delete failed"})",
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


            if (
                deleted == 0
            )
            {

                response.status = 404;

                response.set_content(
                    R"({"status":"error","message":"Project not found"})",
                    "application/json"
                );

                return;
            }


            // ----------------------------------------------
            // DELETE IMAGE FILE
            // ----------------------------------------------

            if (
                !imagePath.empty()
            )
            {

                std::error_code fileError;


                // Database stores:
                //
                // uploads/projects/file.jpg
                //
                // Convert that relative database
                // path to the real filesystem path.

                fs::path imageFilePath =
                    fs::path(
                        "C:/Portfolio/backend"
                    ) /
                    fs::path(
                        imagePath
                    );


                fs::remove(
                    imageFilePath,
                    fileError
                );


                if (fileError)
                {
                    std::cerr
                        << "Image delete warning: "
                        << fileError.message()
                        << std::endl;
                }

            }


            // ----------------------------------------------
            // SUCCESS
            // ----------------------------------------------

            response.set_content(
                R"({"status":"success","message":"Project deleted successfully"})",
                "application/json"
            );

        }
    );

}