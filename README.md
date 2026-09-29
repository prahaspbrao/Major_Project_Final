<div align="center">

  # 🧠 AI Developer Assistant for Code Repositories

  <p align="center">
    <b>Retrieval-Augmented Generation (RAG) Codebase Intelligence System</b><br />
    <i>Final-Year Computer Science & Engineering Major Project (2026)</i>
  </p>

  [![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-v18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Express](https://img.shields.io/badge/Express.js-v4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-v7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Redis](https://img.shields.io/badge/Redis-v7.2-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
  [![Nginx](https://img.shields.io/badge/Nginx-v1.25-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)
  [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📌 Table of Contents
- [Executive Summary](#-executive-summary)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Pin-to-Pin RAG Working Mechanism](#-pin-to-pin-rag-working-mechanism)
- [Redis Caching Strategy](#-redis-caching-strategy)
- [Database Schema Design](#-database-schema-design)
- [API Documentation](#-api-documentation)
- [Getting Started & Installation](#-getting-started--installation)
- [Demonstration & Viva Guide](#-demonstration--viva-guide)
- [Authors & Academic Credits](#-authors--academic-credits)

---

## 📄 Executive Summary

Modern software repositories contain thousands of source files, complex class hierarchies, and deeply nested dependencies. Navigating these codebases poses a steep learning curve for developers.

* **The Problem:** Generic AI assistants (*e.g., Copilot, ChatGPT*) lack visibility into private internal project structures. Traditional code-search tools (*grep, regex*) cannot understand natural language queries or generate explanations.
* **The Solution:** **AI Developer Assistant** combines **Retrieval-Augmented Generation (RAG)** with Large Language Models (LLMs). It parses repositories into semantic chunks (functions, classes, modules), vector-embeds them, and executes grounded similarity search to answer developer queries with **exact file paths and line number source citations**.

> [!NOTE]
> Designed and engineered strictly as a final-year CSE major project at **The National Institute of Engineering (NIE), Mysore**.

---

## 🏗️ System Architecture

```
                                  [ Client Browser ]
                                          │
                                    HTTP (Port 80)
                                          │
                                          ▼
                             [ Nginx Reverse Proxy ]
                                (API Gateway Port 80)
                                 /             \
                        Static /                 \ API Proxy (/api/v1/*)
                              v                   v
                    [ React 18 App ]     [ Express Backend ]
                                            /     |     \
                                           /      |      \
                              [ MongoDB ]    [ Redis ]    [ RAG Engine ]
                             (Data Store)   (Cache)      (Vector Search)
```

---

## ✨ Key Features

- 🔍 **Semantic Repository Parsing**: Language-aware AST/regex chunking for `.js`, `.ts`, `.py`, `.java`, `.cpp`, `.html`, `.css`, `.json`, `.md` with exact `startLine` and `endLine` extraction.
- ⚡ **Dense Vector RAG Engine**: 64-dimensional feature hashing + cosine distance similarity search with 30% keyword match boost.
- 🎯 **Four Specialized Query Modes**:
  - 🔍 **General Query**: Architectural flow and codebase understanding.
  - 📖 **Code Explanation**: Breakdown of inputs, outputs, and execution logic.
  - 🐛 **Bug Localization**: Scans for null pointer risks, missing validation, and unhandled errors with line numbers.
  - 🛠️ **Refactoring Suggestions**: Identifies DRY improvements and modularization opportunities with code diff previews.
- 💻 **Interactive Code Viewer Modal**: Click any grounded citation link to view full source code with target line ranges highlighted in blue.
- 🚀 **Production Redis Caching**: Caches RAG responses (`cache:rag:<repoId>:<mode>:<hash>`) for **<5ms** repeat query execution. Features auto-invalidation on re-indexing.
- 🐳 **5-Service Docker Compose**: Full orchestration across `mongodb`, `redis`, `backend`, `frontend`, and `nginx`.

---

## 🛠️ Technology Stack

| Layer | Technology | Details & Purpose |
| :--- | :--- | :--- |
| **Frontend** | `React 18`, `Vite` | Single-Page Application with fast HMR bundling |
| **Styling** | `Tailwind CSS`, `Lucide React` | Glassmorphic dark UI with `JetBrains Mono` code fonts |
| **State / API** | `Context API`, `Axios` | Global Auth/Repo context with automatic JWT interceptors |
| **Backend** | `Node.js`, `Express.js` | RESTful API server with MVC architecture & middleware pipeline |
| **Database** | `MongoDB v7.0`, `Mongoose` | Document store for users, repos, AST chunks, and chat history |
| **Caching** | `Redis v7.2`, `ioredis` | In-memory query caching with 1-hour TTL & auto-invalidation |
| **Gateway** | `Nginx v1.25` | Reverse proxy gateway managing routing, headers, and compression |
| **Containers**| `Docker`, `Docker Compose` | Containerization across all 5 production services |

---

## ⚙️ Pin-to-Pin RAG Working Mechanism

```
User Query ──► Express API ──► Check Redis Cache
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
         [ Cache HIT ]                                  [ Cache MISS ]
     Return JSON (<5ms)                                       │
 (⚡ Redis Cache HIT Badge)                                   ▼
                                               Compute Query Vector Embedding
                                                              │
                                                              ▼
                                                Retrieve Repo Code Chunks (MongoDB)
                                                              │
                                                              ▼
                                                Cosine Distance Vector Similarity Search
                                                              │
                                                              ▼
                                                Top-K Match Ranking + Keyword Boost
                                                              │
                                                              ▼
                                                Assemble Grounded Prompt & Context
                                                              │
                                                              ▼
                                                Generate Markdown Answer & Citations
                                                              │
                                                              ▼
                                                Store in Redis (TTL: 1 Hour)
```

<details>
<summary><b>🔍 Detailed Step-by-Step Breakdown (Click to expand)</b></summary>

1. **Semantic Code Chunking (`chunkerService.js`)**: Parses files into functions/classes/blocks while extracting `filePath`, `startLine`, `endLine`, `chunkType`, and `symbolName`.
2. **Dense Vector Hashing (`embeddingService.js`)**: Converts chunk text into normalized 64-dimensional feature vector arrays.
3. **Cosine Distance Search (`ragService.js`)**: Measures vector similarity:
   $$\text{Cosine Distance} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$
   Applies a 30% keyword match boost for matching file names and symbol identifiers.
4. **Grounded Response Generation**: Assembles top matching chunks into context, generating answers embedded with citation cards (`L12-L45`).
5. **Interactive Code Inspector**: Clicking **View Source** on any citation card opens `CodeViewerModal.jsx` highlighting lines directly in source code.

</details>

---

## ⚡ Redis Caching Strategy

| Key Pattern | Data Stored | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| `cache:rag:<repoId>:<mode>:<hash>` | Full RAG response & citations | 3600s (1 hr) | Repository re-indexed or deleted |
| `cache:repo_stats:<repoId>` | Repository stats & file breakdown | 3600s (1 hr) | Repository re-indexed or deleted |

> [!TIP]
> **Performance Impact:** Reduces repeat query execution time from ~450ms down to **<5ms**, rendering a **`⚡ Redis Cache HIT`** badge in the UI.

---

## 🗄️ Database Schema Design

<details>
<summary><b>🗂️ MongoDB Collections & Schemas (Click to expand)</b></summary>

### 1. `User` Schema
```javascript
{
  name: String,
  email: { type: String, unique: true, index: true },
  password: String, // Hashed via bcryptjs (Salt rounds: 10)
  role: { type: String, enum: ['developer', 'admin', 'evaluator'], default: 'developer' }
}
```

### 2. `Repository` Schema
```javascript
{
  name: String,
  description: String,
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'indexing', 'indexed', 'failed'] },
  stats: { totalFiles: Number, totalChunks: Number, totalLines: Number, languageBreakdown: Object }
}
```

### 3. `CodeChunk` Schema
```javascript
{
  repoId: { type: Schema.Types.ObjectId, ref: 'Repository', index: true },
  filePath: { type: String, index: true },
  fileName: String,
  startLine: Number,
  endLine: Number,
  chunkType: String,
  symbolName: String,
  content: String,
  vector: [Number], // 64-dimensional embedding vector
  keywords: [String]
}
```

</details>

---

## 🌐 API Documentation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Register new user account | ❌ |
| `POST` | `/api/v1/auth/login` | Authenticate user & receive JWT | ❌ |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | ✅ |
| `GET` | `/api/v1/repos` | List repositories owned by user | ✅ |
| `POST` | `/api/v1/repos` | Register new repository | ✅ |
| `POST` | `/api/v1/repos/:id/index` | Trigger AST chunking & vector indexing | ✅ |
| `GET` | `/api/v1/repos/:id/file` | Fetch full source file for Code Viewer | ✅ |
| `POST` | `/api/v1/chat/sessions` | Create new RAG chat session | ✅ |
| `POST` | `/api/v1/chat/sessions/:id/messages` | Submit query & run RAG pipeline | ✅ |
| `GET` | `/api/v1/rag/status` | System diagnostic status | ❌ |

---

## 🚀 Getting Started & Installation

### Option A: Docker Compose (Recommended)

Run the complete 5-container production architecture with a single command:

```bash
docker compose up --build
```

Access the application:
- 🌐 **Web Application (Nginx Gateway)**: [http://localhost](http://localhost)
- 📡 **Backend Diagnostic Health**: [http://localhost/api/v1/rag/status](http://localhost/api/v1/rag/status)

Stop containers:
```bash
docker compose down
```

---

### Option B: Local Development Setup

#### Prerequisites
- Node.js `v18+`
- MongoDB running on `mongodb://localhost:27017`
- Redis running on `redis://localhost:6379` *(Optional — fallback enabled)*

#### 1. Backend Setup
```bash
cd server
npm install
npm run seed     # Seeds demo user & repository into database
npm run dev      # Runs Express server on http://localhost:5000
```

#### 2. Frontend Setup
```bash
cd client
npm install
npm run dev      # Runs Vite dev server on http://localhost:3000
```

---

## 🧪 Demonstration & Viva Guide

Follow this sequence during project evaluation:

1. **Sign In**: Log in using seed credentials: `prahas@nie.ac.in` / `password123`.
2. **Dashboard Overview**: Inspect total indexed repos, semantic chunks, lines of code, and Redis status.
3. **Re-index Repository**: Click **Re-index** on the pre-loaded `ECommerce-Microservices-Core` repository.
4. **RAG Chat Query**: Click **Query RAG** -> Select **Explanation Mode** -> Ask *"Explain how authentication middleware works in this repo"*.
5. **Inspect Grounded Citation**: Check citation card showing `src/middleware/auth.js` (Lines 1-24). Click **View Source** to open the line-highlighting code viewer.
6. **Bug Localization Mode**: Switch to **Bug Localization** -> Ask *"Find potential unhandled null pointer bugs"*. Observe code analysis highlighting `src/controllers/orderController.js`.
7. **Redis Cache Demonstration**: Resubmit the exact query to observe the **`⚡ Redis Cache HIT`** badge with `<5ms` response time.
8. **System Diagnostics**: Open `/status` page to show live database, Redis, and vector engine status.

---

## 👥 Authors & Academic Credits

* **Student 1**: PRAHAS P B RAO (USN: `4NI23CS144`)
* **Student 2**: P AKHIL DATTA (USN: `4NI23CS132`)
* **Project Guide**: Mrs. Shilpashree S, Assistant Professor
* **Institution**: The National Institute of Engineering, Mysore *(An Autonomous Institution)*
* **Department**: Department of Computer Science & Engineering