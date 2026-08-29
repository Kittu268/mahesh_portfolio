#include "certificate_routes.h"
#include "../auth/auth_manager.h"
#include <sqlite3.h>
#include <string>
#include <fstream>
#include <filesystem>
#include <random>

namespace fs = std::filesystem;


// ==========================================
// Generate unique filename
// ==========================================

static fs::path resolveUploadDirectory()
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
            fs::exists(candidate / "uploads") ||
            fs::exists(candidate / "data") ||
            fs::exists(candidate / "backend")
        )
        {
            return candidate / "uploads";
        }
    }

    return current / "uploads";
}

static std::string generateFileName(
    const std::string& originalName)
{
    static std::mt19937 generator(
        std::random_device{}()
    );

    std::uniform_int_distribution<int> distribution(
        100000,
        999999
    );

    std::string extension;

    size_t dot =
        originalName.find_last_of('.');

    if (dot != std::string::npos)
    {
        extension =
            originalName.substr(dot);
    }

    return "certificate_" +
           std::to_string(distribution(generator)) +
           extension;
}


// ==========================================
// Certificate Routes
// ==========================================

void setupCertificateRoutes(
    httplib::Server& server,
    Database& database)
{

    // ======================================
    // GET ALL CERTIFICATES
    // ======================================

    server.Get(
        "/api/certificates",
        [&database](
            const httplib::Request&,
            httplib::Response& response)
        {
            sqlite3* db =
                database.getConnection();

            const char* sql =
                "SELECT id, name, file_path, uploaded_at "
                "FROM certificates "
                "ORDER BY id DESC;";

            sqlite3_stmt* statement = nullptr;

            if (sqlite3_prepare_v2(
                    db,
                    sql,
                    -1,
                    &statement,
                    nullptr) != SQLITE_OK)
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Database query failed"})",
                    "application/json"
                );

                return;
            }

            std::string json = "[";

            bool first = true;

            while (
                sqlite3_step(statement)
                == SQLITE_ROW)
            {
                if (!first)
                    json += ",";

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

                const char* filePath =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            2
                        )
                    );

                const char* uploadedAt =
                    reinterpret_cast<const char*>(
                        sqlite3_column_text(
                            statement,
                            3
                        )
                    );

                json += "{";

                json += "\"id\":";
                json += std::to_string(id);
                json += ",";

                json += "\"name\":\"";
                json += name ? name : "";
                json += "\",";

                json += "\"file_path\":\"";
                json += filePath ? filePath : "";
                json += "\",";

                json += "\"uploaded_at\":\"";
                json += uploadedAt ? uploadedAt : "";
                json += "\"";

                json += "}";
            }

            json += "]";

            sqlite3_finalize(statement);

            response.set_content(
                json,
                "application/json"
            );
        }
    );


    // ======================================
    // POST /api/certificates
    // ======================================

    server.Post(
        "/api/certificates",
        [&database](
            const httplib::Request& request,
            httplib::Response& response)
        {

            if (!request.form.has_file("certificate"))
            {
                response.status = 400;

                response.set_content(
                    R"({"status":"error","message":"Certificate file is required"})",
                    "application/json"
                );

                return;
            }


            if (!request.form.has_field("name"))
            {
                response.status = 400;

                response.set_content(
                    R"({"status":"error","message":"Certificate name is required"})",
                    "application/json"
                );

                return;
            }


            std::string certificateName =
                request.form.get_field("name");


            if (certificateName.empty())
            {
                response.status = 400;

                response.set_content(
                    R"({"status":"error","message":"Certificate name cannot be empty"})",
                    "application/json"
                );

                return;
            }


            const auto& file =
                request.form.get_file("certificate");


            // Only PDF files

            std::string extension;

            size_t dot =
                file.filename.find_last_of('.');

            if (dot != std::string::npos)
            {
                extension =
                    file.filename.substr(dot);
            }


            if (extension != ".pdf" &&
                extension != ".PDF")
            {
                response.status = 400;

                response.set_content(
                    R"({"status":"error","message":"Only PDF certificates are allowed"})",
                    "application/json"
                );

                return;
            }


            // ----------------------------------
            // Upload directory
            // ----------------------------------

            fs::path uploadDirectory =
                resolveUploadDirectory();

            fs::create_directories(
                uploadDirectory
            );


            std::string storedFileName =
                generateFileName(
                    file.filename
                );


            fs::path filePath =
                uploadDirectory /
                storedFileName;


            // ----------------------------------
            // Save physical file
            // ----------------------------------

            std::ofstream outputFile(
                filePath,
                std::ios::binary
            );


            if (!outputFile)
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Unable to save certificate file"})",
                    "application/json"
                );

                return;
            }


            outputFile.write(
                file.content.data(),
                static_cast<std::streamsize>(
                    file.content.size()
                )
            );

            outputFile.close();


            // ----------------------------------
            // Save database record
            // ----------------------------------

            std::string databasePath =
                "uploads/" +
                storedFileName;


            sqlite3* db =
                database.getConnection();


            const char* sql =
                "INSERT INTO certificates "
                "(name, file_path) "
                "VALUES (?, ?);";


            sqlite3_stmt* statement =
                nullptr;


            if (sqlite3_prepare_v2(
                    db,
                    sql,
                    -1,
                    &statement,
                    nullptr) != SQLITE_OK)
            {
                fs::remove(filePath);

                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Database query failed"})",
                    "application/json"
                );

                return;
            }


            sqlite3_bind_text(
                statement,
                1,
                certificateName.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            sqlite3_bind_text(
                statement,
                2,
                databasePath.c_str(),
                -1,
                SQLITE_TRANSIENT
            );


            if (sqlite3_step(statement)
                != SQLITE_DONE)
            {
                sqlite3_finalize(statement);

                fs::remove(filePath);

                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Failed to save certificate information"})",
                    "application/json"
                );

                return;
            }


            int certificateId =
                static_cast<int>(
                    sqlite3_last_insert_rowid(db)
                );


            sqlite3_finalize(statement);


            response.set_content(
                "{\"status\":\"success\","
                "\"message\":\"Certificate uploaded successfully\","
                "\"id\":" +
                std::to_string(certificateId) +
                "}",
                "application/json"
            );
        }
    );


    // ======================================
    // GET /api/certificates/<id>/file
    // ======================================

    server.Get(
        R"(/api/certificates/(\d+)/file)",
        [&database](
            const httplib::Request& request,
            httplib::Response& response)
        {
            int id =
                std::stoi(
                    request.matches[1].str()
                );


            sqlite3* db =
                database.getConnection();


            const char* sql =
                "SELECT file_path "
                "FROM certificates "
                "WHERE id = ?;";


            sqlite3_stmt* statement =
                nullptr;


            if (sqlite3_prepare_v2(
                    db,
                    sql,
                    -1,
                    &statement,
                    nullptr) != SQLITE_OK)
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


            if (sqlite3_step(statement)
                != SQLITE_ROW)
            {
                sqlite3_finalize(statement);

                response.status = 404;

                response.set_content(
                    R"({"status":"error","message":"Certificate not found"})",
                    "application/json"
                );

                return;
            }


            const char* storedPath =
                reinterpret_cast<const char*>(
                    sqlite3_column_text(
                        statement,
                        0
                    )
                );


            std::string relativePath =
                storedPath
                    ? storedPath
                    : "";


            sqlite3_finalize(statement);


            fs::path filePath =
                fs::absolute(
                    fs::path("..") /
                    relativePath
                );


            if (!fs::exists(filePath))
            {
                response.status = 404;

                response.set_content(
                    R"({"status":"error","message":"Certificate file not found"})",
                    "application/json"
                );

                return;
            }


            std::ifstream inputFile(
                filePath,
                std::ios::binary
            );


            if (!inputFile)
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Unable to open certificate file"})",
                    "application/json"
                );

                return;
            }


            std::string content(
                (
                    std::istreambuf_iterator<char>(
                        inputFile
                    )
                ),
                std::istreambuf_iterator<char>()
            );


            inputFile.close();


            response.set_content(
                content,
                "application/pdf"
            );
        }
    );


    // ======================================
    // DELETE /api/certificates/<id>
    // ======================================

    server.Delete(
        R"(/api/certificates/(\d+))",
        [&database](
            const httplib::Request& request,
            httplib::Response& response)
        {
            int id =
                std::stoi(
                    request.matches[1].str()
                );


            sqlite3* db =
                database.getConnection();


            // ----------------------------------
            // Find file
            // ----------------------------------

            const char* selectSql =
                "SELECT file_path "
                "FROM certificates "
                "WHERE id = ?;";


            sqlite3_stmt* selectStatement =
                nullptr;


            if (sqlite3_prepare_v2(
                    db,
                    selectSql,
                    -1,
                    &selectStatement,
                    nullptr) != SQLITE_OK)
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Database query failed"})",
                    "application/json"
                );

                return;
            }


            sqlite3_bind_int(
                selectStatement,
                1,
                id
            );


            if (sqlite3_step(selectStatement)
                != SQLITE_ROW)
            {
                sqlite3_finalize(
                    selectStatement
                );

                response.status = 404;

                response.set_content(
                    R"({"status":"error","message":"Certificate not found"})",
                    "application/json"
                );

                return;
            }


            const char* storedPath =
                reinterpret_cast<const char*>(
                    sqlite3_column_text(
                        selectStatement,
                        0
                    )
                );


            std::string relativePath =
                storedPath
                    ? storedPath
                    : "";


            sqlite3_finalize(
                selectStatement
            );


            // ----------------------------------
            // Delete physical file
            // ----------------------------------

            fs::path filePath =
                fs::absolute(
                    fs::path("..") /
                    relativePath
                );


            if (fs::exists(filePath))
            {
                fs::remove(filePath);
            }


            // ----------------------------------
            // Delete database record
            // ----------------------------------

            const char* deleteSql =
                "DELETE FROM certificates "
                "WHERE id = ?;";


            sqlite3_stmt* deleteStatement =
                nullptr;


            if (sqlite3_prepare_v2(
                    db,
                    deleteSql,
                    -1,
                    &deleteStatement,
                    nullptr) != SQLITE_OK)
            {
                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Failed to prepare delete query"})",
                    "application/json"
                );

                return;
            }


            sqlite3_bind_int(
                deleteStatement,
                1,
                id
            );


            if (sqlite3_step(deleteStatement)
                != SQLITE_DONE)
            {
                sqlite3_finalize(
                    deleteStatement
                );

                response.status = 500;

                response.set_content(
                    R"({"status":"error","message":"Failed to delete certificate"})",
                    "application/json"
                );

                return;
            }


            int deleted =
                sqlite3_changes(db);


            sqlite3_finalize(
                deleteStatement
            );


            if (deleted == 0)
            {
                response.status = 404;

                response.set_content(
                    R"({"status":"error","message":"Certificate not found"})",
                    "application/json"
                );

                return;
            }


            response.set_content(
                R"({"status":"success","message":"Certificate deleted successfully"})",
                "application/json"
            );
        }
    );
}
