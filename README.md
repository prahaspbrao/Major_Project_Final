# AI Developer Assistant for Code Repositories

> **Final-Year Computer Science & Engineering Major Project (2026)**  
> **Department of Computer Science & Engineering**  
> **The National Institute of Engineering (An Autonomous Institution), Mysore**  
> **Batch**: C9 | **USN**: 4NI23CS144 & 4NI23CS132  

---

## 📌 Executive Summary & Abstract
Large code repositories are difficult for software developers to navigate, inspect, and debug. Generic AI coding assistants (e.g., Copilot, ChatGPT) lack knowledge of a project's private, internal structure, while traditional code-search tools (such as `grep` or `Sourcegraph`) cannot reason about natural-language queries or generate explanations.

This project implements an **AI Developer Assistant combining Large Language Models (LLMs) with Retrieval-Augmented Generation (RAG)**. The repository is parsed into semantic code chunks (functions, classes, modules), vector-embedded, and stored in a searchable database. Developer queries retrieve the most relevant code chunks via dense vector similarity and keyword ranking, passing them to an LLM to generate grounded answers accompanied by explicit **file and line-number source citations**.

---

## 🏗️ System Architecture & Data Flow

```
                                  [ Internet / Client Browser ]
                                                │
                                                ▼
                                     [ Nginx Reverse Proxy ]
                                        (Port 80 Gateway)
                                         /             \
                                        /               \
                       Static Assets /                   \ API Proxy (/api/v1/*)
                                    ▼                     ▼
                          [ React 18 Frontend ]     [ Express.js Backend ]
                             (Vite + Tailwind)         (RESTful API Engine)
                                                      /        |        \
                                                     /         |         \
                                        [ MongoDB v7.0 ]  [ Redis v7.2 ]  [ RAG Vector Engine ]
                                        (Metadata/Chunks)  (Query Cache)  (Dense Cosine Search)
```

---

## 🚀 Key Features

1. **Semantic Repository Indexing**:
   - Parses `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.java`, `.cpp`, `.html`, `.css`, `.json`, `.md` source files.
   - Extracts functions, classes, and code blocks with exact `startLine` and `endLine` boundaries.
2. **Retrieval-Augmented Generation (RAG)**:
   - Dense vector similarity (64-dimensional feature hashing + cosine distance) combined with keyword relevance scoring.
   - Grounded context generation preventing LLM hallucination.
3. **Four Dedicated Query Modes**:
   - 🔍 **General Query**: Architecture & codebase understanding.
   - 📖 **Code Explanation**: Natural-language operational breakdown of functions and modules.
   - 🐛 **Bug Localization**: Identifies null pointer risks, missing validations, and unhandled exceptions with line-range references.
   - 🛠️ **Refactoring Suggestions**: Provides DRY improvements, modularization, and clean-code refactoring previews.
4. **Interactive Source Code Viewer Modal**:
   - Clicking any citation link highlights target line ranges directly inside full file source code.
5. **Production Redis Caching**:
   - In-memory response caching (`cache:rag:<repoId>:<mode>:<qHash>`) with TTL (1 hour).
   - Automatic cache invalidation upon repository re-indexing or deletion.
   - Graceful fallback mode if Redis server is temporarily down.
6. **Docker Compose & Nginx Gateway Orchestration**:
   - Multi-container Docker deployment (`mongodb`, `redis`, `backend`, `frontend`, `nginx`).

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Context API, Axios | Responsive SPA UI with glassmorphism styling |
| **Backend** | Node.js, Express.js (ES Modules), JWT, bcryptjs, Helmet | Modular REST API server with rate limiting |
| **Database** | MongoDB v7.0, Mongoose | Schema validation & vector chunk storage |
| **Caching** | Redis v7.2, `ioredis` | Response & statistics caching with TTL |
| **Reverse Proxy** | Nginx v1.25 | API Gateway, SSL termination ready, static hosting |
| **Containers** | Docker, Docker Compose | Containerization across all 5 services |

---

## 🗄️ Database Design (MongoDB Schemas)

### 1. `User` Collection
- `name`: String (Required)
- `email`: String (Required, Unique, Indexed)
- `password`: String (Hashed via bcrypt)
- `role`: Enum (`developer`, `admin`, `evaluator`)

### 2. `Repository` Collection
- `name`: String (Required)
- `description`: String
- `owner`: ObjectId (Ref `User`)
- `status`: Enum (`pending`, `indexing`, `indexed`, `failed`)
- `stats`: Object (`totalFiles`, `totalChunks`, `totalLines`, `languageBreakdown`)

### 3. `CodeChunk` Collection
- `repoId`: ObjectId (Ref `Repository`, Indexed)
- `filePath`: String (Indexed)
- `fileName`: String
- `startLine`: Number
- `endLine`: Number
- `chunkType`: Enum (`function`, `class`, `module`, `block`, `documentation`)
- `symbolName`: String
- `content`: String (Raw code snippet)
- `vector`: Array of Numbers (Embedding array)
- `keywords`: Array of Strings

### 4. `ChatSession` & `ChatMessage` Collections
- Tracks user conversations, queries, response times (`responseTimeMs`), Redis cache hits (`cached: true`), and grounded citation arrays.

---

## ⚡ Redis Caching Strategy

| Key Pattern | Data Stored | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| `cache:rag:<repoId>:<mode>:<hash>` | Full RAG response & citations | 3600s (1 hr) | Repository re-indexed or deleted |
| `cache:repo_stats:<repoId>` | Repository stats & file breakdown | 3600s (1 hr) | Repository re-indexed or deleted |

### Cache Flow Architecture
```
Request ──► Express API ──► Check Redis ──► HIT ──► Return Cached JSON (<5ms)
                                │
                              MISS
                                ▼
                         Execute RAG Search ──► Save in Redis ──► Return JSON
```

---

## 🌐 API Documentation

### Authentication Routes (`/api/v1/auth`)
- `POST /register`: Register user account (`name`, `email`, `password`, `role`).
- `POST /login`: Authenticate user and receive JWT token.
- `GET /me`: Get current authenticated user profile.

### Repository Routes (`/api/v1/repos`)
- `GET /`: List all repositories owned by user.
- `POST /`: Register a new code repository.
- `GET /:repoId`: Fetch repository details & indexed chunk count.
- `POST /:repoId/index`: Trigger semantic chunking & vector indexing.
- `GET /:repoId/file`: Fetch full source file content for inline code viewer.
- `DELETE /:repoId`: Delete repository, chunks, chat sessions, and purge Redis cache.

### Chat & RAG Routes (`/api/v1/chat`, `/api/v1/rag`)
- `POST /sessions`: Create a new RAG chat session.
- `GET /sessions/:sessionId/messages`: Get chat history.
- `POST /sessions/:sessionId/messages`: Process RAG query with grounded citations.
- `GET /rag/status`: System diagnostics (MongoDB status, Redis status, vector engine health).

---

## 💻 Running the Project

### Option A: Running with Docker Compose (Recommended)

Run the entire 5-container architecture with a single command:

```bash
docker compose up --build
```

Access the application in your browser:
- **Web App (Nginx Gateway)**: [http://localhost](http://localhost)
- **Backend API**: [http://localhost/api/v1/rag/status](http://localhost/api/v1/rag/status)

To stop all containers:
```bash
docker compose down
```

---

### Option B: Running Locally (Development Mode)

#### Prerequisites
1. Node.js (v18+)
2. MongoDB running locally on `mongodb://localhost:27017`
3. Redis running locally on `redis://localhost:6379` (Optional - fallback enabled)

#### 1. Backend Setup
```bash
cd server
npm install
npm run seed     # Pre-populates database with demo user & repository
npm run dev      # Starts Express server on http://localhost:5000
```

#### 2. Frontend Setup
```bash
cd client
npm install
npm run dev      # Starts Vite dev server on http://localhost:3000
```

---

## 🧪 Demonstration / Viva Presentation Flow

Follow this exact flow during project evaluation:

1. **Sign In**:
   - Log in using credentials: `prahas@nie.ac.in` / `password123`.
2. **Dashboard Overview**:
   - Observe total indexed repositories, semantic vector chunks, total lines of code, and Redis status.
3. **Repository Indexing**:
   - Click **Re-index** on the pre-loaded `ECommerce-Microservices-Core` repo.
   - Observe progress indicator and updated chunk metrics.
4. **RAG Grounded Chat**:
   - Click **Query RAG** to open the assistant interface.
   - Select **Explanation Mode**: Query *"Explain how authentication middleware works in this repo"*.
   - Inspect the grounded response with file path (`src/middleware/auth.js`) and exact line range (`L1-L24`).
5. **Interactive Source Code Viewer**:
   - Click **View Source** on the citation card.
   - Observe the full file inspector modal opening with target lines highlighted in blue.
6. **Bug Localization Mode**:
   - Switch mode to **Bug Localization**: Query *"Find potential unhandled null pointer or cart validation bugs"*.
   - Observe analysis pointing directly to `src/controllers/orderController.js`.
7. **Refactoring Suggestions Mode**:
   - Switch mode to **Refactoring**: Query *"Suggest clean code refactoring for payment processing"*.
   - Observe refactored code preview for `src/services/paymentService.js`.
8. **Demonstrate Redis Caching**:
   - Submit the exact same query again.
   - Observe the **⚡ Redis Cache HIT** badge appearing with `<5ms` response time!
9. **System Diagnostics**:
   - Navigate to `/status` page to show live database, Redis, and RAG vector engine connectivity.

---

## 👥 Authors & Academic Credits

- **Student 1**: PRAHAS P B RAO (USN: `4NI23CS144`)
- **Student 2**: P AKHIL DATTA (USN: `4NI23CS132`)
- **Project Guide**: Mrs. Shilpashree S, Assistant Professor
- **Institution**: The National Institute of Engineering, Mysore (An Autonomous Institution)
#   M a j o r _ P r o j e c t _ F i n a l  
 