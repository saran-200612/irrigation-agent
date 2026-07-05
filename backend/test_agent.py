import sys
import os

# Set up search path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from db.database import engine, Base, SessionLocal
from db.models import Field, Schedule, User
from agent.orchestrator import get_irrigation_recommendation
import json

def test():
    print("Testing backend agent initialization...")
    
    # 1. Create SQLite tables if not exist
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized.")

    db = SessionLocal()
    try:
        # 2. Check if test field exists, or create it
        field = db.query(Field).filter(Field.name == "Test Ridge Tomato").first()
        if not field:
            print("Registering test field...")
            # Ensure default user exists
            user = db.query(User).filter(User.email == "default@example.com").first()
            if not user:
                from auth.security import hash_password
                user = User(
                    email="default@example.com",
                    hashed_password=hash_password("defaultpassword"),
                    full_name="Default User"
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            field = Field(
                name="Test Ridge Tomato",
                crop="Tomato",
                soil_type="Sandy Loam",
                area_sqm=1200.0,
                latitude=36.7783,
                longitude=-119.4179,
                growth_stage="Flowering",
                user_id=user.id
            )
            db.add(field)
            db.commit()
            db.refresh(field)
            print(f"Test field registered with ID {field.id}.")
        else:
            print(f"Using existing test field ID {field.id}.")

        # 3. Test recommendation generation
        print("\n--- Running Orchestrator Schedule calculation ---")
        rec = get_irrigation_recommendation(field)
        
        print("\n--- Recommendation Result ---")
        print(json.dumps(rec, indent=2))
        
        # Save to database
        db_schedule = Schedule(
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
        print("\nSchedule recorded in SQLite successfully.")

    except Exception as e:
        print(f"\nTest execution encountered error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
