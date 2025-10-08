# Reading Rewards

## Overview
Reading Rewards is a full-stack application for tracking reading progress and rewarding chapters read. It features:
- **Backend:** Spring Boot (Java) with Flyway migrations
- **Database:** PostgreSQL (via Docker)
- **Frontend:** React + TypeScript + MUI (Material-UI)
- **Book Data:** Integrates with Open Library API for book search and details

## Quick Start (Development)

### Prerequisites
- Docker & Docker Compose (for database)
- Java 21+ (for backend)
- Node.js 18+ (for frontend)

### 1. Start the Database (Docker)
Run from the project root:
```
docker-compose up -d postgres
```
This starts only the PostgreSQL database in a container, mapped to port 5432.

### 2. Start the Backend Server (Locally)
Run from the `backend` directory:
```
./mvnw spring-boot:run
```
or
```
mvn spring-boot:run
```
The backend will connect to the local Postgres DB and run Flyway migrations automatically. API available at [http://localhost:8080/api](http://localhost:8080/api).

### 3. Start the Frontend
Run from the `frontend` directory:
```
npm install
npm start
```
The frontend runs on [http://localhost:3000](http://localhost:3000) and expects the backend at `http://localhost:8080`.

## Required Configuration Files

This project requires several configuration files that are **gitignored** for security and local customization. You must create these files before running the app:

### 1. Root `.env` (for Docker/Postgres)
Location: `/.env`

Used by Docker Compose to configure the Postgres database container. Example:

```env
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
```

### 2. Frontend `.env` (for React/Vite)
Location: `/frontend/.env`

Used by the React frontend to configure API endpoints and other settings. Example:

```env
VITE_CLIENT_PORT=3000
VITE_SERVER_HOST=localhost
VITE_SERVER_PORT=8080
VITE_API_URL=http://localhost:8080/api
VITE_KID_NAME=your_kid_name
```

**Required:**
- `VITE_API_URL` must point to your backend API root (default: `http://localhost:8080/api`)

### 3. Backend `flyway.conf` (for DB migrations)
Location: `/backend/flyway.conf`

Used by Flyway to connect to the database for running migrations. Example:

```properties
flyway.url=jdbc:postgresql://localhost:5432/your_db_name
flyway.user=your_db_user
flyway.password=your_db_password
flyway.cleanDisabled=false
```

**Required:**
- `flyway.url` must match your Postgres connection string
- `flyway.user` and `flyway.password` must match your DB credentials

---

**Note:** All of these files are listed in `.gitignore` and must be created locally. See the examples above for the required keys and values.

## Features & Notes
- Search books via Open Library (no API key required)
- If chapters are missing, add them manually via the UI (POST to `/api/books/{olid}/chapters`)
- Credits: $1 (100 cents) per chapter read
- Flyway migration initializes all tables
- Database is persistent via Docker volume

## Project Structure
- `backend/` — Spring Boot application
- `frontend/` — React + TypeScript UI (using MUI)
- `docker-compose.yml` — Database container config
- `README.md` — Project documentation

