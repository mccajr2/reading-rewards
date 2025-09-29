
# Reading Rewards

## Overview
Reading Rewards is a full-stack application for tracking reading progress and rewarding chapters read. It features:
- **Backend:** Spring Boot (Java) with Flyway migrations
- **Database:** PostgreSQL (via Docker)
- **Frontend:** React + TypeScript + Bootstrap
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

## Features & Notes
- Search books via Open Library (no API key required)
- If chapters are missing, add them manually via the UI (POST to `/api/books/{olid}/chapters`)
- Credits: $1 (100 cents) per chapter read
- Flyway migration initializes all tables
- Database is persistent via Docker volume

## Project Structure
- `backend/` — Spring Boot application
- `frontend/` — React + TypeScript UI
- `docker-compose.yml` — Database container config
- `README.md` — Project documentation

