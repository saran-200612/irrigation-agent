import os
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt

# Load secret and expiration from environment (fallback defaults for dev)
JWT_SECRET = os.getenv("JWT_SECRET", "change_this_to_a_long_random_string")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "1440"))
ALGORITHM = "HS256"

def hash_password(plain: str) -> str:
    """Hash a plaintext password using bcrypt."""
    pw_bytes = plain.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    """Create a JWT token containing the provided data.

    Args:
        data: Dictionary of data to encode (typically {"sub": user_id}).
        expires_minutes: Custom expiration in minutes. If omitted, use the default.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes or JWT_EXPIRES_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode a JWT token and return its payload.

    Raises:
        JWTError: If token is invalid or expired.
    """
    payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    return payload
