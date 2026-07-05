# Irrigation Scheduling Agent 🌾💧
> An AI-powered full-stack advisor recommending optimal watering events for crop health, powered by Grok, ChromaDB RAG, and live weather forecast integrations.

## Live Demo & Screenshots
- **Backend Deployment**: [Deployed on Render](https://render.com) (Use your custom URL in production)
- **Frontend Deployment**: [Deployed on Vercel](https://vercel.com) (Use your custom URL in production)

---

## Problem & Solution
**The Problem**: Irrigation management is typically either purely reactive (watering when plants wilt) or based on simplistic schedules that ignore immediate weather shifts or granular crop-growth phases. This leads to water waste, root rot, or under-watering stress.

**The Solution**: The Irrigation Scheduling Agent integrates real-time local weather forecasts (via WeatherAPI.com), expert crop guidelines retrieved from a local ChromaDB Vector database (RAG), and a Python-based LLM agent (Grok-beta). It analyzes soil water depletion limits and upcoming rain offsets to issue precise watering recommendations (when to water, volume depth, and duration).

---

## Architecture Diagram

```
React (Vite) Frontend  ──REST/JSON──▶  FastAPI Backend
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              SQLite (fields,       ChromaDB (RAG:          xAI API
              schedules,            agronomy knowledge      (Grok-beta)
              chat_logs)            base)                        │
                                                                  ▼
                                                          WeatherAPI.com
                                                          (forecast data)
```

---

## Features
- **Semantic Crop Retrieval**: Leverages ChromaDB and `all-MiniLM-L6-v2` embeddings to retrieve targeted growth-phase and soil-type guidelines from markdown-based knowledge bases.
- **Weather API Integration**: Inspects 7-day forecast variables (temperature, relative humidity, rain probability, and total precipitation depth).
- **Dual-Engine LLM Core**: Supports the OpenAI-compatible **xAI Grok** API natively as its primary driver, with built-in SDK fallback for **Anthropic Claude 3.5 Sonnet**.
- **Self-Correcting LLM Validations**: Enforces a strict Pydantic JSON schema. If the model responds in raw text or invalid JSON, it executes a contextual retry loop.
- **Code-Level Safety Override Guardrails**:
  - Automatically suppresses/skips watering recommendations if rain probability is $\ge 70\%$ and expected precipitation is $\ge 3.0\text{ mm}$ on the scheduled date.
  - Clamps duration (max 180 min) and volume depth (max 50 mm) to safe limits.
- **Visual Instrumentation UI**: A high-fidelity dark-themed instrument panel utilizing a signature animated SVG circular moisture dial, custom rain indicator charts, and zebra-striped history tables.

---

## Tech Stack
| Tier | Technology | Description |
|---|---|---|
| **Frontend** | React v18, Vite | High-performance user interface framework |
| **Styling** | Tailwind CSS v3 | Custom dark themes and theme variable tokens |
| **Backend** | FastAPI, Uvicorn | High-speed ASGI REST API and runner |
| **Database** | SQLite, SQLAlchemy | Structured metadata store for fields, logs, and schedules |
| **Vector DB** | ChromaDB | Lightweight document indexer and embedding search |
| **Embeddings** | `sentence-transformers` | Runs `all-MiniLM-L6-v2` locally on CPU |
| **LLM Core** | xAI Grok-beta / Anthropic | Expert agronomist advisor and follow-up chat agent |

---

## Repository Structure
```
irrigation-scheduling-agent/
├── backend/
│   ├── main.py                     # FastAPI application setup
│   ├── Dockerfile                  # Container instructions for Render
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Template configuration parameters
│   ├── agent/
│   │   ├── orchestrator.py         # Handles telemetry context and LLM retry
│   │   ├── prompts.py              # LLM system prompts and worked few-shots
│   │   ├── llm_client.py           # Handles x.ai Grok/Anthropic API calls
│   │   ├── weather.py              # WeatherAPI.com client connection
│   │   └── schemas.py              # Pydantic validation schemas
│   ├── rag/
│   │   ├── build_index.py          # Indexes KB markdown documents
│   │   ├── retriever.py            # Retrieves top-k matching segments
│   │   └── knowledge_base/         # Markdown crop guides
│   │       ├── tomato.md
│   │       ├── wheat.md
│   │       ├── maize.md
│   │       └── general_irrigation_principles.md
│   └── db/
│       ├── database.py             # SQLAlchemy session manager
│       └── models.py               # Database schemas for Fields/Schedules/Logs
├── frontend/
│   ├── index.html                  # Core HTML structure
│   ├── package.json                # Frontend packages & scripts
│   ├── vite.config.js              # Vite server config
│   ├── tailwind.config.js          # Custom theme configuration
│   ├── src/
│   │   ├── main.jsx                # Application root mounting
│   │   ├── App.jsx                 # Dashboard coordinator
│   │   ├── api/
│   │   │   └── client.js           # API fetch methods
│   │   ├── styles/
│   │   │   └── index.css           # Fonts, root theme variables, scrollbars
│   │   └── components/
│   │       ├── FieldForm.jsx       # Register new sensors (left rail)
│   │       ├── MoistureDial.jsx    # SVG circular gauge component
│   │       ├── ScheduleCard.jsx    # Recommendation reasoning & metadata
│   │       ├── WeatherStrip.jsx    # 7-day visual forecast columns
│   │       ├── ChatPanel.jsx       # Follow-up advisor thread
│   │       └── HistoryTable.jsx    # Historical recommendation logs
└── README.md
```

---

## Setup Instructions

### Backend
1. Navigate to the backend directory and create a virtual environment:
   ```bash
   cd backend
   py -m venv venv
   .\venv\Scripts\activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment configurations:
   ```bash
   cp .env.example .env
   # Add your GROK_API_KEY and WEATHERAPI_KEY inside the .env file
   ```
4. Build the ChromaDB vector database index:
   ```bash
   python rag/build_index.py
   ```
5. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Configure the environment variables:
   ```bash
   cp .env.example .env
   # Ensure VITE_API_URL points to the running backend (default: http://localhost:8000)
   ```
4. Start the frontend developer server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## API Reference

| Method | Route | Description |
|---|---|---|
| **POST** | `/fields` | Registers a new field sensor |
| **GET** | `/fields` | Lists all registered field sensors |
| **GET** | `/fields/{id}` | Retrieves details for one sensor |
| **GET** | `/fields/{id}/weather` | Serves current 7-day WeatherAPI forecast |
| **POST** | `/fields/{id}/schedule` | Triggers RAG/Weather advice generation |
| **GET** | `/fields/{id}/schedules` | Lists all historical scheduling advice |
| **GET** | `/fields/{id}/chat` | Loads conversation log history |
| **POST** | `/fields/{id}/chat` | Executes follow-up agent dialog turn |
| **GET** | `/health` | Verifies ASGI server integrity |

---

## Prompt Engineering Design
- **Structured Outputs**: The agent enforces output via Pydantic matching the exact JSON format. No markdown wrap-tags are returned to the frontend.
- **Step-by-Step Reasonings**: The orchestrator asks the LLM to structure its reasoning internally. This is displayed within the `ScheduleCard` as a guide.
- **Worked Few-Shots**: Includes worked mock evaluations showing the model how to defer watering on forecasted rain days.

---

## Deployment Steps

### Backend on Render
1. Connect your GitHub repository to **Render**.
2. Select **Web Service** and set the Root Directory to `backend/`.
3. Select **Docker** environment (the included `Dockerfile` will install packages, download the embedding model, build the default vector database, and host the server).
4. Under Environment variables, add:
   - `GROK_API_KEY`: xAI Grok developer token
   - `WEATHERAPI_KEY`: WeatherAPI token
5. Deploy.

### Frontend on Vercel
1. Import your project directory to **Vercel**.
2. Select Root Directory as `frontend/`.
3. Set the Framework preset to **Vite**.
4. In Environment variables, set `VITE_API_URL` to your live Render backend URL.
5. Deploy.

---

## Future Improvements
- **Sensor Telemetry Sync**: Bind real physical moisture probes to override forecast guesses.
- **Satellite Health Overlays**: Pull NDVI vegetation maps over field coordinates.
- **Offline Mode**: Cache recommendations on the device in case farm connectivity is temporarily lost.

---

## License
Distributed under the MIT License. See `LICENSE` for details.
