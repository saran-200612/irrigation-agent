import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Auth imports
from .auth.router import router as auth_router
from .auth.dependencies import get_current_user

from db.database import engine, Base, get_db
from db import models
from agent import schemas
from agent.orchestrator import get_irrigation_recommendation
from agent.weather import get_forecast, summarize_forecast
from agent.prompts import CHAT_SYSTEM_PROMPT
from agent.llm_client import call_llm
from rag.retriever import retriever

# Initialize tables on startup using lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Database startup: creating tables...")
    Base.metadata.create_all(bind=engine)
    yield
    print("Database shutdown...")
app = FastAPI(lifespan=lifespan)
from fastapi.staticfiles import StaticFiles

# Serve the built React frontend (static files) from /frontend_dist
app.mount("/", StaticFiles(directory="frontend_dist", html=True), name="frontend")
# Include auth router
app.include_router(auth_router, prefix="/auth")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify Vercel domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "time": datetime.utcnow().isoformat()}

# --- Database Explorer Endpoint ---

@app.get("/db/tables")
def get_db_tables(table: str = None, page: int = 1, page_size: int = 50):
    """Return all tables with columns and row data from the SQLite database."""
    import sqlite3
    from db.database import DB_PATH

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        table_names = [row["name"] for row in cursor.fetchall()]

        if table and table in table_names:
            # Return data for a specific table
            # Get total count
            cursor.execute(f'SELECT COUNT(*) as cnt FROM [{table}]')
            total_rows = cursor.fetchone()["cnt"]

            # Get paginated rows
            offset = (page - 1) * page_size
            cursor.execute(f'SELECT * FROM [{table}] LIMIT ? OFFSET ?', (page_size, offset))
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description] if cursor.description else []

            row_data = []
            for row in rows:
                row_dict = {}
                for col in columns:
                    val = row[col]
                    # Truncate long strings for display
                    if isinstance(val, str) and len(val) > 300:
                        val = val[:300] + "…"
                    row_dict[col] = val
                row_data.append(row_dict)

            return {
                "tables": table_names,
                "selected_table": table,
                "columns": columns,
                "rows": row_data,
                "total_rows": total_rows,
                "page": page,
                "page_size": page_size,
                "total_pages": max(1, (total_rows + page_size - 1) // page_size),
            }
        else:
            # Return overview of all tables
            overview = []
            for t in table_names:
                cursor.execute(f'SELECT COUNT(*) as cnt FROM [{t}]')
                count = cursor.fetchone()["cnt"]
                cursor.execute(f'PRAGMA table_info([{t}])')
                cols = [{"name": c["name"], "type": c["type"]} for c in cursor.fetchall()]
                overview.append({"name": t, "row_count": count, "columns": cols})

            return {"tables": table_names, "overview": overview}
    finally:
        conn.close()

@app.get("/fields/{id}/weather")
def get_field_weather(id: int, db: Session = Depends(get_db)):
    field = db.query(models.Field).filter(models.Field.id == id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    try:
        return get_forecast(field.latitude, field.longitude, days=7)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {e}")


# --- Field Endpoints ---

@app.post("/fields", response_model=schemas.FieldResponse)
def create_field(field_in: schemas.FieldCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_field = models.Field(
        name=field_in.name,
        crop=field_in.crop,
        soil_type=field_in.soil_type,
        area_sqm=field_in.area_sqm,
        latitude=field_in.latitude,
        longitude=field_in.longitude,
        growth_stage=field_in.growth_stage,
        last_watered_at=field_in.last_watered_at,
        user_id=current_user.id
    )
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    return db_field

@app.get("/fields", response_model=List[schemas.FieldResponse])
def list_fields(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Field).filter(models.Field.user_id == current_user.id).all()

@app.get("/fields/{id}", response_model=schemas.FieldResponse)
def get_field(id: int, db: Session = Depends(get_db)):
    field = db.query(models.Field).filter(models.Field.id == id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field

# --- Schedule Endpoints ---

@app.post("/fields/{id}/schedule", response_model=schemas.ScheduleResponse)
def generate_schedule(id: int, db: Session = Depends(get_db)):
    field = db.query(models.Field).filter(models.Field.id == id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Generate schedule through Orchestrator
    rec = get_irrigation_recommendation(field)
    
    # Save recommended schedule to SQLite
    db_schedule = models.Schedule(
        field_id=field.id,
        recommended_datetime=rec["next_watering_datetime"],
        duration_minutes=rec["duration_minutes"],
        water_mm=rec["water_mm"],
        confidence=rec["confidence"],
        reasoning=rec["reasoning"],
        risk_flags=json.dumps(rec["risk_flags"]),
        raw_llm_response=rec["raw_llm_response"]
    )
    db.add(db_schedule)
    
    db.commit()
    db.refresh(db_schedule)
    
    # Parse back the risk flags JSON for response mapping
    response_data = schemas.ScheduleResponse(
        id=db_schedule.id,
        field_id=db_schedule.field_id,
        recommended_datetime=db_schedule.recommended_datetime,
        duration_minutes=db_schedule.duration_minutes,
        water_mm=db_schedule.water_mm,
        confidence=db_schedule.confidence,
        reasoning=db_schedule.reasoning,
        risk_flags=json.loads(db_schedule.risk_flags),
        created_at=db_schedule.created_at
    )
    return response_data

@app.get("/fields/{id}/schedules", response_model=List[schemas.ScheduleResponse])
def get_schedule_history(id: int, db: Session = Depends(get_db)):
    field = db.query(models.Field).filter(models.Field.id == id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
        
    schedules = db.query(models.Schedule).filter(models.Schedule.field_id == id).order_by(models.Schedule.created_at.desc()).all()
    
    response_list = []
    for s in schedules:
        response_list.append(
            schemas.ScheduleResponse(
                id=s.id,
                field_id=s.field_id,
                recommended_datetime=s.recommended_datetime,
                duration_minutes=s.duration_minutes,
                water_mm=s.water_mm,
                confidence=s.confidence,
                reasoning=s.reasoning,
                risk_flags=json.loads(s.risk_flags),
                created_at=s.created_at
            )
        )
    return response_list

# --- Chat Endpoints ---

@app.get("/fields/{id}/chat", response_model=List[schemas.ChatMessage])
def get_chat_history(id: int, db: Session = Depends(get_db)):
    field = db.query(models.Field).filter(models.Field.id == id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return db.query(models.ChatLog).filter(models.ChatLog.field_id == id).order_by(models.ChatLog.created_at.asc()).all()

@app.post("/fields/{id}/chat", response_model=schemas.ChatResponse)
def chat_about_schedule(id: int, request: schemas.ChatRequest, db: Session = Depends(get_db)):
    field = db.query(models.Field).filter(models.Field.id == id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    # Get latest schedule
    latest_schedule = db.query(models.Schedule).filter(models.Schedule.field_id == id).order_by(models.Schedule.created_at.desc()).first()
    
    # Retrieve RAG context chunks
    retrieved_chunks = retriever.retrieve(
        crop=field.crop,
        growth_stage=field.growth_stage,
        question=request.message,
        k=3
    )
    chunks_text = "\n\n".join(retrieved_chunks) if retrieved_chunks else "No agronomy guidelines found."

    # Build Context Summary
    schedule_context = "No recommended schedule yet."
    if latest_schedule:
        schedule_context = (
            f"Recommended Time: {latest_schedule.recommended_datetime}\n"
            f"Duration: {latest_schedule.duration_minutes} mins\n"
            f"Amount: {latest_schedule.water_mm} mm\n"
            f"Confidence: {latest_schedule.confidence}\n"
            f"Reasoning: {latest_schedule.reasoning}\n"
            f"Risk Flags: {latest_schedule.risk_flags}"
        )

    context_prompt = (
        f"### FIELD CONTEXT\n"
        f"Crop: {field.crop} | Growth Stage: {field.growth_stage} | Soil: {field.soil_type} | Area: {field.area_sqm} sqm\n"
        f"Latitude: {field.latitude} | Longitude: {field.longitude}\n\n"
        f"### LATEST RECOMMENDED SCHEDULE\n"
        f"{schedule_context}\n\n"
        f"### RETRIEVED AGRONOMY GUIDELINES\n"
        f"{chunks_text}\n\n"
        f"Please answer the user's question relative to this schedule and guidelines."
    )

    # Fetch prior chat logs
    prior_logs = db.query(models.ChatLog).filter(models.ChatLog.field_id == id).order_by(models.ChatLog.created_at.asc()).all()
    
    # Construct LLM conversation payload
    messages = []
    messages.append({
        "role": "user",
        "content": f"[System Context Injection - Do not show this to the user]\n{context_prompt}"
    })
    messages.append({
        "role": "assistant",
        "content": "Understood. I will use this field context, schedule parameters, and agronomy guidelines for subsequent answers."
    })
    
    # Append conversation history
    for log in prior_logs:
        messages.append({
            "role": "user" if log.role == "user" else "assistant",
            "content": log.message
        })
        
    # Append latest message
    messages.append({
        "role": "user",
        "content": request.message
    })

    # Call LLM
    try:
        assistant_reply = call_llm(CHAT_SYSTEM_PROMPT, messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate chat response: {e}")

    # Persist chat logs
    user_log = models.ChatLog(field_id=id, role="user", message=request.message)
    assistant_log = models.ChatLog(field_id=id, role="assistant", message=assistant_reply)
    db.add(user_log)
    db.add(assistant_log)
    db.commit()

    return schemas.ChatResponse(response=assistant_reply)
