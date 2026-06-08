# Odyssey: AI-Powered Interview Preparation Platform

Welcome to Odyssey, an interactive platform designed to help developers prepare for technical interviews. The platform uses AI to conduct mock interviews, evaluate responses, and provide structured feedback across various technology topics.

## Project Structure

This repository is set up as a monorepo containing both the frontend and backend applications:

*   **[`/frontend`](file:///d:/Code/Odyssey/frontend)**: Next.js web application built with Tailwind CSS, React Query, and Zustand.
*   **[`/backend`](file:///d:/Code/Odyssey/backend)**: Express + TypeScript API server using Prisma (PostgreSQL) and Redis for caching.
*   **[`/docs`](file:///d:/Code/Odyssey/docs)**: Auxiliary resources, such as Postman collections.

For specific details, setup guides, and environment configuration for each component, please refer to their respective READMEs:
*   [Frontend README](file:///d:/Code/Odyssey/frontend/README.md)
*   [Backend README](file:///d:/Code/Odyssey/backend/README.md)

---

## Quick Start (Docker Compose)

The easiest way to spin up the entire stack (including the database, pgAdmin, Redis, backend, and frontend) is using Docker Compose.

### Prerequisites

*   Docker and Docker Compose installed.
*   A `GROQ_API_KEY` (required for AI interviewer interactions).

### Booting the Stack

1.  Export your Groq API key (or add it directly to a root `.env` or pass it inline):
    ```bash
    # Linux/macOS
    export GROQ_API_KEY="your_groq_api_key"

    # Windows (PowerShell)
    $env:GROQ_API_KEY="your_groq_api_key"
    ```
2.  Run the docker-compose command from the root directory:
    ```bash
    docker compose up --build
    ```

### Available Services

Once the build is complete, you can access the following services:

*   **Frontend Client**: [http://localhost:3000](http://localhost:3000)
*   **Backend API**: [http://localhost:5000](http://localhost:5000)
*   **API Documentation (Swagger)**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
*   **pgAdmin (Database GUI)**: [http://localhost:5050](http://localhost:5050) (Login: `admin@admin.com` / `admin`)
*   **Redis Cache**: `localhost:6379`
*   **PostgreSQL Database**: `localhost:5432`
