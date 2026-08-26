cmake_minimum_required(VERSION 3.20)

project(MaheshPortfolio
    VERSION 1.0
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(portfolio

    main.cpp

    auth/auth_manager.cpp

    database/database.cpp
    database/certificate_database.cpp
    database/admin_database.cpp

    routes/project_routes.cpp
    routes/certificate_routes.cpp
    routes/auth_routes.cpp
)

target_include_directories(portfolio PRIVATE

    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/database
    ${CMAKE_CURRENT_SOURCE_DIR}/routes
)

if(WIN32)

    target_link_libraries(portfolio PRIVATE
        ws2_32
        sqlite3
    )

else()

    target_link_libraries(portfolio PRIVATE
        sqlite3
        pthread
    )

endif()