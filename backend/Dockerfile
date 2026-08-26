FROM ubuntu:24.04

# ==========================================
# INSTALL BUILD DEPENDENCIES
# ==========================================

RUN apt-get update && \
    apt-get install -y \
        build-essential \
        cmake \
        libsqlite3-dev \
        sqlite3 && \
    rm -rf /var/lib/apt/lists/*

# ==========================================
# APPLICATION DIRECTORY
# ==========================================

WORKDIR /app

# ==========================================
# COPY SOURCE
# ==========================================

COPY . .

# ==========================================
# CREATE REQUIRED DIRECTORIES
# ==========================================

RUN mkdir -p /app/data
RUN mkdir -p /app/uploads/projects

# ==========================================
# BUILD
# ==========================================

RUN mkdir -p build && \
    cd build && \
    cmake .. && \
    cmake --build . --config Release

# ==========================================
# PORT
# ==========================================

EXPOSE 8080

# ==========================================
# START SERVER
# ==========================================

CMD ["./build/portfolio"]