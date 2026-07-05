from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from typing import Optional

from db import models
from .security import decode_access_token, hash_password
from db.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        # Fall back to a default user to allow unauthenticated access (e.g. from the frontend or test endpoints)
        user = db.query(models.User).filter(models.User.email == "default@example.com").first()
        if not user:
            user = models.User(
                email="default@example.com",
                hashed_password=hash_password("defaultpassword"),
                full_name="Default User"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user
