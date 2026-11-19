import logging
import uuid
from typing import List, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    get_current_user, require_admin, UserRole,
    get_password_hash, verify_password, create_access_token, create_refresh_token
)
from app.models.user import User
from pydantic import BaseModel, ConfigDict

logger = logging.getLogger(__name__)

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    refresh_token: str

class UserCreate(BaseModel):
    username: str
    password: str
    email: str
    role: str = "viewer"

class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    role: str
    is_active: bool

@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)) -> Any:
    """Login to get access and refresh tokens."""
    try:
        stmt = select(User).where(User.username == request.username)
        result = await db.execute(stmt)
        user = result.scalars().first()

        if not user or not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await db.commit()

        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        access_token = create_access_token(data={"sub": str(user.id), "role": role_str})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        logger.info(f"User {user.username} logged in successfully.")
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/refresh", response_model=Token)
async def refresh_token(request: TokenRefresh, db: AsyncSession = Depends(get_db)) -> Any:
    """Refresh an access token."""
    try:
        from app.core.security import verify_token
        payload = verify_token(request.refresh_token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        access_token = create_access_token(data={"sub": str(user.id), "role": role_str})
        new_refresh = create_refresh_token(data={"sub": str(user.id)})

        return {"access_token": access_token, "refresh_token": new_refresh, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)) -> Any:
    """Logout current user."""
    return {"msg": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> Any:
    """Get current user profile."""
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "role": role_str,
        "is_active": current_user.is_active
    }

@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update current user profile."""
    try:
        if update_data.email:
            current_user.email = update_data.email
        await db.commit()
        await db.refresh(current_user)
        role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        return {
            "id": str(current_user.id),
            "username": current_user.username,
            "email": current_user.email,
            "role": role_str,
            "is_active": current_user.is_active
        }
    except Exception as e:
        logger.error(f"Error updating profile for user {current_user.id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/register", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    """Create a new user (admin only)."""
    try:
        stmt = select(User).where(User.username == user_in.username)
        result = await db.execute(stmt)
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Username already registered")

        new_user = User(
            id=uuid.uuid4(),
            username=user_in.username,
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            role=UserRole(user_in.role) if user_in.role in [r.value for r in UserRole] else UserRole.VIEWER,
            is_active=True
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        logger.info(f"Admin created new user {new_user.username}")
        role_str = new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role)
        return {
            "id": str(new_user.id),
            "username": new_user.username,
            "email": new_user.email,
            "role": role_str,
            "is_active": new_user.is_active
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/users", response_model=List[UserResponse], dependencies=[Depends(require_admin)])
async def list_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)) -> Any:
    """List all users (admin only)."""
    stmt = select(User).offset(skip).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()
    out = []
    for u in users:
        role_str = u.role.value if hasattr(u.role, 'value') else str(u.role)
        out.append({
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "role": role_str,
            "is_active": u.is_active
        })
    return out

@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)])
async def deactivate_user(user_id: str, db: AsyncSession = Depends(get_db)) -> Any:
    """Deactivate a user (admin only)."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    await db.commit()
    logger.info(f"Admin deactivated user {user_id}")
    return {"msg": f"User {user_id} deactivated successfully"}
