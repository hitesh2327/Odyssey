# AI-Powered Interview Preparation Platform - Backend

This is the production-grade, modular, feature-based backend implementation for the AI-Powered Interview Preparation Platform.

---

## Tech Stack
- **Runtime**: Node.js & Express.js
- **Language**: TypeScript
- **Database Layer**: PostgreSQL & Prisma ORM
- **Authentication**: Stateless JWT Authentication & Password Hashing (bcrypt)
- **Validation**: Schema-level input parsing with Zod
- **API Documentation**: Swagger UI (`swagger-ui-express`)
- **Security**: Helmet, CORS, and Express Rate Limiting
- **Logging**: Structured Winston Logger
- **Containerization**: Docker & Docker Compose

---

## Folder Structure

The project uses clean architecture principles with feature-based modules:
```text
backend/
├── src/
│   ├── config/              # Configuration loader & Swagger spec
│   ├── constants/           # Core constants
│   ├── middleware/          # Express middlewares (Auth, Error, Validation)
│   ├── modules/             # Feature-based business components
│   │   ├── auth/            # Auth schemas, controllers, and services
│   │   ├── users/           # Users domain logic
│   │   ├── topics/          # Topics domain logic & placeholders
│   │   ├── sessions/        # Sessions domain logic & placeholders
│   │   ├── questions/       # Questions domain logic & placeholders
│   │   ├── answers/         # Answers domain logic
│   │   ├── ai-assistance/   # AI assistance domain logic
│   │   └── ai-interactions/ # AI interactions domain logic
│   │
│   ├── lib/                 # Core SDK wrappers (Prisma, Logger, OpenAI)
│   ├── routes/              # Central express router
│   ├── types/               # Type definition overrides (Express Request)
│   ├── utils/               # Common utilities (ApiError)
│   ├── app.ts               # Express configuration setup
│   └── server.ts            # Server entrypoint and graceful shutdown
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Automatically managed db migration files
│   └── seed.ts              # Idempotent topics seed script
│
├── Dockerfile             # Multi-stage production container specification
├── .env.example             # Template for variables setup
└── README.md                # This file
```

---

## Environment Variables

Create a `.env` file in the `backend` directory using the `.env.example` template:

```env
PORT=5000

# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/db_name?schema=public"

# Stateless JWT token signing key (minimum 8 characters)
JWT_SECRET="your_jwt_signing_secret_here"

# Optional OpenAI API Key for future generations
OPENAI_API_KEY=""

# Environment mode ('development', 'production', 'test')
NODE_ENV=development
```

---

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Database Generation & Migration**:
   To create the tables in your PostgreSQL database, run:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seeding the Database**:
   Seeding inserts the 28 standard interview topics (Java, JavaScript, TypeScript, Node.js, Systems Design, etc.) into the database idempotently:
   ```bash
   npm run prisma:seed
   ```

4. **Generating the Client**:
   If the Prisma schema is modified, generate the client artifact:
   ```bash
   npx prisma generate
   ```

---

## Run Commands

- **Development Mode** (Runs with hot reloading via `ts-node-dev`):
  ```bash
   npm run dev
   ```

- **Build Application**:
  ```bash
   npm run build
   ```

- **Production Mode** (Runs compiled JavaScript from `dist/`):
  ```bash
   npm start
   ```

- **Formatting & Linting**:
  ```bash
   npm run lint     # Check lint rules
   npm run format   # Format with prettier
   ```

---

## Docker Commands

The project contains a root-level `docker-compose.yml` that provisions a PostgreSQL database and builds/runs the Node.js backend.

To boot the entire application:
```bash
docker-compose up --build
```
This command:
1. Builds the backend multi-stage container.
2. Instantiates PostgreSQL.
3. Performs migrations and seeds topics.
4. Boots the web application on port `5000`.

---

## API Endpoints

### Swagger Documentation
Interactive API docs are served at:
- **`GET http://localhost:5000/api-docs`**

---

### Endpoints Table

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/health` | Health Check (Returns status UP) | No |
| **POST** | `/api/v1/auth/register` | Register User (Returns JWT token) | No |
| **POST** | `/api/v1/auth/login` | Login User (Returns JWT token) | No |
| **POST** | `/api/v1/auth/logout` | Logout User (Client clears token) | Yes (Bearer Token) |
| **GET** | `/api/v1/auth/me` | Get Profile Details for User | Yes (Bearer Token) |
| **GET** | `/api/v1/topics` | Get Topics (Future Module Placeholder) | No |
| **POST** | `/api/v1/sessions` | Create Session (Future Module Placeholder) | No |
| **GET** | `/api/v1/questions` | Get Questions (Future Module Placeholder) | No |

---

### Authentication Headers
For authenticated endpoints, provide the token in the request headers:
```http
Authorization: Bearer <your_jwt_token>
```
