from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import models, database
from . import schemas, security, dependencies

router = APIRouter()

@router.post("/signup", response_model=schemas.UserOut)
def signup(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if email already exists
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed = security.hash_password(user_in.password)
    db_user = models.User(email=user_in.email, hashed_password=hashed, full_name=user_in.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return schemas.UserOut.from_orm(db_user)

@router.post("/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not db_user or not security.verify_password(user_in.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = security.create_access_token({"sub": db_user.id})
    return schemas.Token(access_token=access_token)
