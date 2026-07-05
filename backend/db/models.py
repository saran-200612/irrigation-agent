import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from db.database import Base

# User model for authentication
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    fields = relationship("Field", back_populates="owner")

# Field model now references a user
class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    crop = Column(String, nullable=False)
    soil_type = Column(String, nullable=False)
    area_sqm = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    growth_stage = Column(String, nullable=False)
    last_watered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="fields")
    schedules = relationship("Schedule", back_populates="field", cascade="all, delete-orphan")
    chat_logs = relationship("ChatLog", back_populates="field", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    recommended_datetime = Column(String, nullable=False)  # ISO string or LLM format
    duration_minutes = Column(Integer, nullable=False)
    water_mm = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    reasoning = Column(Text, nullable=False)
    risk_flags = Column(Text, nullable=False)  # JSON serialized array of strings
    raw_llm_response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    field = relationship("Field", back_populates="schedules")

class ChatLog(Base):
    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    field = relationship("Field", back_populates="chat_logs")
