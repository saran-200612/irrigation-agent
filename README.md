# Irrigation Scheduling Agent 🌾💧

> **An AI-powered agronomic decision platform** that fuses real-time weather telemetry, crop-specific RAG knowledge retrieval, and large-language-model reasoning to deliver precise, field-level irrigation schedules — complete with confidence scoring, risk-flag analysis, and a conversational follow-up advisor.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Problem & Solution](#problem--solution)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Authentication & Security](#authentication--security)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Prompt Engineering Design](#prompt-engineering-design)
- [Deployment Guide](#deployment-guide)
- [Changelog](#changelog)
- [Roadmap](#roadmap)
- [License](#license)

---

## Problem & Solution

### The Problem

Traditional irrigation management falls into two failure modes:

1. **Reactive watering** — operators wait until visible plant stress (wilting, leaf curl) before irrigating, by which point yield damage has already occurred.
2. **Static scheduling** — fixed timers ignore real-time weather shifts, crop growth-phase transitions, and soil-specific drainage characteristics, leading to chronic over- or under-watering.

Both approaches waste water, degrade soil health, and reduce harvest quality.

### The Solution

The **Irrigation Scheduling Agent** closes this gap by combining three intelligence layers into a single recommendation pipeline:

| Layer | Source | Purpose |
|---|---|---|
| **Weather Telemetry** | WeatherAPI.com (7-day forecast) | Detects upcoming rain events, temperature extremes, and humidity shifts to offset or defer watering |
| **Agronomic Knowledge Base** | ChromaDB RAG over curated markdown guides | Retrieves crop-specific water requirements per growth stage and soil type |
| **LLM Reasoning Engine** | xAI Grok-beta / Anthropic Claude | Synthesizes weather + knowledge into a structured recommendation with confidence scoring and risk flags |

The result: a **single API call** returns exactly _when_ to water, _how much_ depth (mm), _how long_ (minutes), a confidence score, human-readable reasoning, and any active risk flags — all validated against a strict Pydantic schema before delivery.

---

## Key Features

### Intelligence Pipeline
- **Semantic Crop Retrieval** — ChromaDB with `all-MiniLM-L6-v2` embeddings retrieves growth-phase and soil-type guidelines from a curated markdown knowledge base.
- **Live Weather Integration** — Inspects 7-day forecast variables: temperature, relative humidity, daily rain probability, and total precipitation depth. Includes a deterministic mock fallback when API keys are unavailable.
- **Dual-Engine LLM Core** — Primary support for **xAI Grok** (via OpenAI-compatible API) with automatic SDK fallback to **Anthropic Claude 3.5 Sonnet**.
- **Self-Correcting Schema Validation** — Enforces strict Pydantic JSON output. If the model returns raw text or malformed JSON, a contextual retry loop re-prompts with error feedback.

### Safety & Guardrails
- **Rain Suppression Override** — Automatically skips watering if rain probability ≥ 70% and expected precipitation ≥ 3.0 mm on the scheduled date.
- **Volume Clamping** — Duration capped at 180 minutes; depth capped at 50 mm to prevent over-irrigation.

### User Interface
- **Instrument-Grade Dashboard** — Dark-themed telemetry panel with animated SVG moisture dials, 7-day weather forecast columns, and zebra-striped history tables.
- **Conversational Advisor** — RAG-augmented chat panel for follow-up questions about schedules, crop science, and risk mitigation.
- **Secure Operator Authentication** — Full signup/login flow with JWT session management and bcrypt password hashing.

---

## System Architecture

```
┌─────────────────────────────────┐
│     React (Vite) Frontend       │
│  ┌───────────┐  ┌────────────┐  │
│  │ AuthPage  │  │ Dashboard  │  │
│  │ (JWT Flow)│  │ (Telemetry)│  │
│  └─────┬─────┘  └──────┬─────┘  │
│        │               │        │
└────────┼───────────────┼────────┘
         │  REST / JSON  │
         ▼               ▼
┌─────────────────────────────────┐
│       FastAPI Backend           │
│                                 │
│  ┌──────────┐  ┌─────────────┐  │
│  │ Auth     │  │ Orchestrator│  │
│  │ (JWT +   │  │ (LLM Retry  │  │
│  │  bcrypt) │  │  + Schema)  │  │
│  └────┬─────┘  └──────┬──────┘  │
│       │               │         │
│  ┌────▼─────┐  ┌──────▼──────┐  │
│  │ SQLite   │  │ ChromaDB    │  │
│  │ (Users,  │  │ (RAG Vector │  │
│  │  Fields, │  │  Knowledge  │  │
│  │  Logs)   │  │  Base)      │  │
│  └──────────┘  └─────────────┘  │
│                                 │
│  ┌──────────────────────────┐   │
│  │  External Services       │   │
│  │  • WeatherAPI.com        │   │
│  │  • xAI Grok / Anthropic  │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

---

## Tech Stack

| Tier | Technology | Role |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | SPA framework with HMR development server |
| **Styling** | Tailwind CSS v3 | Custom dark/light theme with design token variables |
| **Backend** | FastAPI 0.111 + Uvicorn | Async-capable ASGI REST API server |
| **Auth** | python-jose + bcrypt | JWT token issuance, validation, and password hashing |
| **Database** | SQLite + SQLAlchemy 2.0 | Relational store for users, fields, schedules, and chat logs |
| **Vector DB** | ChromaDB | Embedding-based document retrieval for agronomic guidelines |
| **Embeddings** | sentence-transformers | Runs `all-MiniLM-L6-v2` locally on CPU |
| **LLM** | xAI Grok-beta / Anthropic | Agronomist advisor and conversational chat agent |
| **Weather** | WeatherAPI.com | 7-day hyperlocal forecast data provider |

---

## Authentication & Security

The platform implements a complete operator authentication system using industry-standard protocols:

### How It Works

```
┌──────────┐    POST /auth/signup     ┌──────────┐
│  Client  │ ───────────────────────▶ │  Server  │
│          │    { email, password,    │          │
│          │      full_name }         │          │
│          │                          │  bcrypt  │──▶ SQLite (users)
│          │                          │  hash()  │
│          │    POST /auth/login      │          │
│          │ ───────────────────────▶ │          │
│          │    { email, password }   │ verify() │
│          │                          │          │
│          │ ◀─────────────────────── │  JWT     │
│          │    { access_token,       │  sign()  │
│          │      token_type }        │          │
│          │                          │          │
│          │    GET /fields           │          │
│          │    Authorization: Bearer │ decode() │
│          │ ───────────────────────▶ │ validate │
└──────────┘                          └──────────┘
```

### Security Stack

| Component | Implementation | Detail |
|---|---|---|
| **Password Storage** | `bcrypt` with random salt generation | Plaintext passwords never persisted; only the bcrypt hash is stored |
| **Token Format** | HS256-signed JWT via `python-jose` | Payload contains `sub` (user ID as string) and `exp` (expiration timestamp) |
| **Token Lifetime** | Configurable via `JWT_EXPIRES_MINUTES` | Defaults to 1440 minutes (24 hours); overridable via environment variable |
| **Secret Key** | `JWT_SECRET` environment variable | Must be set to a cryptographically random string in production |
| **CORS** | Wildcard in development; domain-locked in production | `allow_credentials=True` with configurable `allow_origins` |

### Development Fallback

When no `Authorization` header is provided, the backend creates or retrieves a default operator (`default@example.com`) to allow seamless local development and testing without mandatory login. This behavior is controlled by `auto_error=False` on the OAuth2 scheme and should be **disabled in production** by setting `auto_error=True`.

---

## Repository Structure

```
irrigation-scheduling-agent/
├── backend/
│   ├── main.py                        # FastAPI app — route registration, CORS, lifespan events
│   ├── Dockerfile                     # Production container (Render deployment)
│   ├── requirements.txt               # Pinned Python dependencies
│   ├── .env.example                   # Template for required environment variables
│   │
│   ├── auth/                          # ── Authentication Module ──
│   │   ├── router.py                  # POST /auth/signup and POST /auth/login endpoints
│   │   ├── schemas.py                 # Pydantic models: UserCreate, UserLogin, Token, UserOut
│   │   ├── security.py                # bcrypt hashing, JWT encode/decode utilities
│   │   └── dependencies.py            # FastAPI dependency: get_current_user (token → User)
│   │
│   ├── agent/                         # ── Intelligence Pipeline ──
│   │   ├── orchestrator.py            # Telemetry context assembly + LLM retry loop
│   │   ├── prompts.py                 # System prompts with worked few-shot examples
│   │   ├── llm_client.py             # xAI Grok / Anthropic API routing and invocation
│   │   ├── weather.py                 # WeatherAPI.com client + deterministic mock fallback
│   │   └── schemas.py                 # Pydantic schemas for schedules, fields, chat
│   │
│   ├── rag/                           # ── Knowledge Retrieval ──
│   │   ├── build_index.py             # Indexes markdown documents into ChromaDB
│   │   ├── retriever.py               # Semantic top-k retrieval by crop + growth stage
│   │   └── knowledge_base/            # Curated agronomic guidelines (markdown)
│   │       ├── tomato.md
│   │       ├── wheat.md
│   │       ├── maize.md
│   │       └── general_irrigation_principles.md
│   │
│   └── db/                            # ── Data Persistence ──
│       ├── database.py                # SQLAlchemy engine, session factory, Base
│       └── models.py                  # ORM models: User, Field, Schedule, ChatLog
│
├── frontend/
│   ├── index.html                     # Entry HTML shell
│   ├── package.json                   # NPM dependencies and scripts
│   ├── vite.config.js                 # Vite dev server and build configuration
│   ├── tailwind.config.js             # Theme tokens, custom colors, font families
│   └── src/
│       ├── main.jsx                   # React DOM root mount
│       ├── App.jsx                    # Auth gate + dashboard state coordinator
│       ├── api/
│       │   └── client.js             # Centralized API client with JWT header injection
│       ├── layout/
│       │   └── Layout.jsx            # NavBar + theme toggle + logout wrapper
│       ├── pages/
│       │   └── Dashboard.jsx         # Main telemetry view: dial, weather, chat, history
│       ├── styles/
│       │   └── index.css             # CSS custom properties, fonts, scrollbar styling
│       └── components/
│           ├── AuthPage.jsx           # Login / Signup form with validation feedback
│           ├── FieldForm.jsx          # Field sensor registration form
│           ├── MoistureDial.jsx       # Animated SVG circular confidence gauge
│           ├── ScheduleCard.jsx       # Recommendation card with reasoning display
│           ├── WeatherStrip.jsx       # 7-day forecast tile grid
│           ├── ChatPanel.jsx          # RAG-augmented conversational advisor
│           └── HistoryTable.jsx       # Paginated schedule history log
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python** 3.10+ with `pip`
- **Node.js** 18+ with `npm`
- **API Keys** (optional — mock fallbacks are available for both):
  - [xAI Grok](https://console.x.ai/) or [Groq Cloud](https://console.groq.com/) API key
  - [WeatherAPI.com](https://www.weatherapi.com/) API key

### 1. Backend Setup

```bash
# Clone and navigate to the backend
cd backend

# Create and activate a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys:
#   GROK_API_KEY=your_key_here
#   WEATHERAPI_KEY=your_key_here
#   JWT_SECRET=your_random_secret_string    (optional, has dev default)

# Build the ChromaDB vector index (one-time)
python rag/build_index.py

# Launch the API server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
# Navigate to the frontend
cd frontend

# Install packages
npm install

# Configure the backend URL (optional, defaults to http://localhost:8000)
cp .env.example .env

# Start the development server
npm run dev
```

The UI will be available at `http://localhost:3000`.

### 3. First Run Walkthrough

1. Open `http://localhost:3000` — you will see the **Authentication Page**.
2. **Register** a new operator account (email, password ≥ 8 characters, full name).
3. **Log in** with your credentials — a JWT token is stored in `localStorage`.
4. **Deploy a Field Sensor** using the left-rail form (name, crop, soil, coordinates).
5. **Generate a Schedule** — the orchestrator fetches weather, retrieves RAG context, and calls the LLM.
6. **Review the Dashboard** — moisture dial, recommendation card, 7-day weather strip, and chat advisor.

---

## API Reference

### Authentication Endpoints

| Method | Route | Body | Response | Auth |
|---|---|---|---|---|
| `POST` | `/auth/signup` | `{ email, password, full_name }` | `UserOut` (id, email, created_at) | None |
| `POST` | `/auth/login` | `{ email, password }` | `{ access_token, token_type }` | None |

### Field Management

| Method | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/fields` | Register a new field sensor | Bearer Token |
| `GET` | `/fields` | List all fields for the authenticated operator | Bearer Token |
| `GET` | `/fields/{id}` | Retrieve a single field's metadata | — |
| `GET` | `/fields/{id}/weather` | Fetch the 7-day weather forecast for a field's coordinates | — |

### Schedule & Chat

| Method | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/fields/{id}/schedule` | Generate a new irrigation recommendation | — |
| `GET` | `/fields/{id}/schedules` | List all historical recommendations for a field | — |
| `POST` | `/fields/{id}/chat` | Send a follow-up question to the agronomic advisor | — |
| `GET` | `/fields/{id}/chat` | Retrieve the full conversation history for a field | — |

### System

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Returns server status and UTC timestamp |

> **Note**: Routes marked with **Bearer Token** require an `Authorization: Bearer <token>` header. All other routes currently allow unauthenticated access in development mode via the default operator fallback.

---

## Prompt Engineering Design

The LLM integration follows three design principles to ensure reliable, actionable output:

1. **Structured Schema Enforcement** — Every LLM response must conform to a Pydantic model (`next_watering_datetime`, `duration_minutes`, `water_mm`, `confidence`, `reasoning`, `risk_flags`). No markdown formatting or conversational preamble is accepted.

2. **Chain-of-Thought Reasoning** — The system prompt instructs the model to internally evaluate soil depletion rates, forecast rain offsets, and growth-stage water requirements before emitting the final JSON. The `reasoning` field captures this analysis for operator review.

3. **Worked Few-Shot Examples** — The prompt includes complete worked examples demonstrating correct behavior for edge cases (e.g., deferring watering when significant rain is forecast within 48 hours).

---

## Deployment Guide

### Backend on Render

1. Connect your GitHub repository to [Render](https://render.com).
2. Select **Web Service** → Root Directory: `backend/`.
3. Environment: **Docker** (the included `Dockerfile` handles dependency installation, model download, index build, and server launch).
4. Add environment variables:
   - `GROK_API_KEY` — xAI Grok or Groq Cloud developer token
   - `WEATHERAPI_KEY` — WeatherAPI.com token
   - `JWT_SECRET` — A cryptographically random string (required for production)
5. Deploy.

### Frontend on Vercel

1. Import the repository to [Vercel](https://vercel.com).
2. Root Directory: `frontend/`.
3. Framework Preset: **Vite**.
4. Environment variable: `VITE_API_URL` → your live Render backend URL.
5. Deploy.

---

## Changelog

### v1.2.1 — Authentication System Fix (July 2026)

#### Issues Identified & Resolved

| # | Issue | Root Cause | Resolution |
|---|---|---|---|
| 1 | **Login returns valid token but all authenticated requests fail** | `create_access_token()` encoded the `sub` claim as an integer (`{"sub": 42}`). The `python-jose` library's `jwt.decode()` enforces that the JWT subject must be a string per [RFC 7519 §4.1.2](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.2), causing a `JWTError: Subject must be a string` on every token validation. | Changed `router.py` to pass `str(db_user.id)` as the `sub` claim. Updated `dependencies.py` to parse the decoded string back to `int` with `ValueError` handling. |
| 2 | **Signup endpoint returns 500 Internal Server Error** | The `UserOut` Pydantic schema declared `created_at: str`, but SQLAlchemy's `DateTime` column returns a `datetime.datetime` object. Pydantic v2 strict validation rejected the type mismatch during response serialization. | Changed `schemas.py` to declare `created_at: datetime` (imported from the `datetime` module), aligning the schema with the database column type. |

#### Files Modified

| File | Change |
|---|---|
| `backend/auth/schemas.py` | `created_at` type: `str` → `datetime` |
| `backend/auth/router.py` | JWT `sub` claim: `db_user.id` → `str(db_user.id)` |
| `backend/auth/dependencies.py` | Token decode: added `int()` cast with `ValueError` guard |

---

## Roadmap

- **Sensor Telemetry Sync** — Bind physical soil moisture probes (e.g., Teros-12) to override forecast-based estimates with real-time readings.
- **Satellite Health Overlays** — Integrate NDVI vegetation index maps over field coordinates for canopy stress detection.
- **Offline Mode** — Cache recommendations on-device using IndexedDB for continued operation during intermittent farm connectivity.
- **Multi-Tenant RBAC** — Role-based access control for farm managers, field operators, and read-only stakeholders.
- **Scheduled Automation** — Cron-triggered recommendation regeneration with push notifications for critical watering events.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full terms.
