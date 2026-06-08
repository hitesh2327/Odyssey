# Odyssey - Backend API

This is the API server for the Odyssey interview platform. It handles authentication, interview session management, questions, answers, AI evaluations, and caching.

## Tech Stack

*   **Runtime**: Node.js & Express
*   **Language**: TypeScript
*   **Database**: PostgreSQL + Prisma ORM
*   **Cache**: Redis (Cache-Aside pattern for dashboard APIs)
*   **LLM Provider**: Groq SDK (Llama 3 models) / OpenAI
*   **Validation**: Zod (request body schema verification)
*   **Auth**: JWT (Stateless)

---

## Folder Structure

```text
backend/
├── prisma/              # Prisma schema, migrations, and seeding scripts
├── src/
│   ├── config/          # Configurations (db, redis, swagger, environment)
│   ├── constants/       # Global constants & enums
│   ├── lib/             # Third-party SDK clients (Prisma, Redis, Groq)
│   ├── middleware/      # Auth validation, error handlers, and logging middleware
│   ├── modules/         # Feature-based business logic
│   │   ├── auth/        # Login, registration, token handling
│   │   ├── dashboard/   # Analytics, history, performance (cached via Redis)
│   │   ├── sessions/    # Mock interview session logic
│   │   ├── questions/   # Question bank & generation
│   │   ├── answers/     # Evaluation of user responses
│   │   └── ai-assistance/# Hints & AI tips during the session
│   ├── routes/          # Central API routing table
│   ├── utils/           # Helper utility functions & classes (e.g. ApiError)
│   ├── app.ts           # Express application configuration
│   └── server.ts        # Server listener and graceful shutdown management
```

---

## Setup & Running Locally

### Prerequisites

*   Node.js (v18 or higher)
*   A running PostgreSQL instance
*   A running Redis instance (optional but recommended for caching)
*   A Groq API key (`GROQ_API_KEY`)

### 1. Environment Setup

Create a `.env` file in the `backend` directory using this template:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interview_db?schema=public"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET="use-a-strong-secret-key-in-production"

# AI Services
GROQ_API_KEY="your_groq_api_key_here"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Migrations and Seed

Deploy migrations, generate the Prisma client, and seed the default topics:

```bash
# Apply migrations
npx prisma migrate dev

# Generate client
npx prisma generate

# Seed initial topics
npm run prisma:seed
```

### 4. Running the App

*   **Development (with hot reload)**:
    ```bash
    npm run dev
    ```
*   **Production Build**:
    ```bash
    npm run build
    npm start
    ```

---

## API & Documentation

### Interactive Swagger Docs

When the server is running, the interactive API documentation is served at:
[http://localhost:5000/api-docs](http://localhost:5000/api-docs)

### Primary API Routes

| Endpoint | Method | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/health` | GET | No | Check backend health status |
| `/api/v1/auth/register` | POST | No | Create new user account |
| `/api/v1/auth/login` | POST | No | Authenticate & retrieve JWT |
| `/api/v1/auth/me` | GET | Yes | Retrieve current profile details |
| `/api/v1/dashboard` | GET | Yes | Cached stats & overview performance |
| `/api/v1/dashboard/history`| GET | Yes | Cached history of interview sessions |
| `/api/v1/dashboard/performance`| GET | Yes | Cached detailed topic-wise metrics |
| `/api/v1/sessions` | POST | Yes | Initialize a new interview session |
| `/api/v1/answers` | POST | Yes | Submit an answer for evaluation |
