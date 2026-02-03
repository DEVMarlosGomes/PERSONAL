from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import pandas as pd
from io import BytesIO
import base64
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'personal-trainer-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Upload directory for exercise images
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Personal Trainer API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== EXERCISE CATEGORIES ====================
EXERCISE_CATEGORIES = [
    "ABDÔMEN", "AERÓBIO", "ALONGAMENTO", "ANTEBRAÇO", "BÍCEPS",
    "DORSAL", "ELÁSTICOS E FAIXAS", "FUNCIONAL", "GLÚTEOS",
    "INFERIORES", "MAT PILATES", "MOBILIDADE", "OMBRO",
    "PARA FAZER EM CASA", "PEITORAL", "TRÍCEPS"
]

# ==================== EXERCISE IMAGE DATABASE ====================
EXERCISE_IMAGES = {
    "supino reto": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "supino inclinado": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "supino declinado": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "crucifixo": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "crossover": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "flexão": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400",
    "puxada": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "puxada frontal": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "remada": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "remada curvada": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "remada baixa": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "pulldown": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "desenvolvimento": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400",
    "elevação lateral": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400",
    "elevação frontal": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400",
    "rosca": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca direta": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca alternada": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca martelo": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca scott": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "tríceps": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps pulley": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps corda": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps testa": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps francês": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "agachamento": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
    "leg press": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "extensora": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "flexora": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "cadeira extensora": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "cadeira flexora": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "stiff": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
    "levantamento terra": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
    "panturrilha": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "gêmeos": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "abdominal": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    "abdominal canivete": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    "abdominal com corda na polia": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    "prancha": "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400",
    "crunch": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
}

EXERCISE_VIDEOS = {
    "supino reto": "https://www.youtube.com/embed/gRVjAtPip0Y",
    "supino inclinado": "https://www.youtube.com/embed/jPLdzuHckI8",
    "puxada frontal": "https://www.youtube.com/embed/CAwf7n6Luuc",
    "remada curvada": "https://www.youtube.com/embed/kBWAon7ItDw",
    "agachamento": "https://www.youtube.com/embed/ultWZbUMPL8",
    "leg press": "https://www.youtube.com/embed/IZxyjW7MPJQ",
    "rosca direta": "https://www.youtube.com/embed/ykJmrZ5v0Oo",
    "tríceps pulley": "https://www.youtube.com/embed/2-LAMcpzODU",
    "desenvolvimento": "https://www.youtube.com/embed/qEwKCR5JCog",
    "elevação lateral": "https://www.youtube.com/embed/3VcKaXpzqRo",
    "extensora": "https://www.youtube.com/embed/YyvSfVjQeL0",
    "flexora": "https://www.youtube.com/embed/1Tq3QdYUuHs",
    "stiff": "https://www.youtube.com/embed/1uDiW5--rAE",
    "levantamento terra": "https://www.youtube.com/embed/op9kVnSso6Q",
    "abdominal": "https://www.youtube.com/embed/Xyd_fa5zoEU",
    "prancha": "https://www.youtube.com/embed/ASdvN_XEl_c",
}

def get_exercise_image(exercise_name: str) -> Optional[str]:
    name_lower = exercise_name.lower().strip()
    if name_lower in EXERCISE_IMAGES:
        return EXERCISE_IMAGES[name_lower]
    for key, url in EXERCISE_IMAGES.items():
        if key in name_lower or name_lower in key:
            return url
    return None

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "personal"

class StudentCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    phone: Optional[str] = None
    notes: Optional[str] = None
    # New fields
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    objective: Optional[str] = None  # emagrecimento, hipertrofia, condicionamento, etc.
    medical_restrictions: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    objective: Optional[str] = None
    medical_restrictions: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    personal_id: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    objective: Optional[str] = None
    medical_restrictions: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ==================== PHYSICAL ASSESSMENT MODELS ====================

class PhysicalAssessmentCreate(BaseModel):
    student_id: str
    assessment_type: str  # "manual", "bioimpedance", "pollock_7"
    date: str
    weight: Optional[float] = None
    height: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    bmi: Optional[float] = None
    # Body measurements
    chest: Optional[float] = None
    waist: Optional[float] = None
    hip: Optional[float] = None
    arm_right: Optional[float] = None
    arm_left: Optional[float] = None
    thigh_right: Optional[float] = None
    thigh_left: Optional[float] = None
    calf_right: Optional[float] = None
    calf_left: Optional[float] = None
    # Pollock 7 folds
    fold_chest: Optional[float] = None
    fold_abdominal: Optional[float] = None
    fold_thigh: Optional[float] = None
    fold_triceps: Optional[float] = None
    fold_subscapular: Optional[float] = None
    fold_suprailiac: Optional[float] = None
    fold_midaxillary: Optional[float] = None
    notes: Optional[str] = None

class PhysicalAssessmentResponse(BaseModel):
    id: str
    student_id: str
    personal_id: str
    assessment_type: str
    date: str
    weight: Optional[float] = None
    height: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    bmi: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hip: Optional[float] = None
    arm_right: Optional[float] = None
    arm_left: Optional[float] = None
    thigh_right: Optional[float] = None
    thigh_left: Optional[float] = None
    calf_right: Optional[float] = None
    calf_left: Optional[float] = None
    fold_chest: Optional[float] = None
    fold_abdominal: Optional[float] = None
    fold_thigh: Optional[float] = None
    fold_triceps: Optional[float] = None
    fold_subscapular: Optional[float] = None
    fold_suprailiac: Optional[float] = None
    fold_midaxillary: Optional[float] = None
    notes: Optional[str] = None
    created_at: str

# ==================== TRAINING ROUTINE MODELS ====================

class TrainingRoutineCreate(BaseModel):
    student_id: str
    name: str  # "Semana 1", "Rotina A", etc.
    start_date: str
    end_date: Optional[str] = None
    objective: Optional[str] = None  # "Hipertrofia", "Emagrecimento"
    level: Optional[str] = None  # "Iniciante", "Intermediário", "Avançado"
    day_type: Optional[str] = None  # "Numérico", "Por Letra", "Por Dia da Semana"
    auto_archive: bool = True
    notes: Optional[str] = None

class TrainingRoutineUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    objective: Optional[str] = None
    level: Optional[str] = None
    day_type: Optional[str] = None
    auto_archive: Optional[bool] = None
    notes: Optional[str] = None
    status: Optional[str] = None  # "active", "archived"

class TrainingRoutineResponse(BaseModel):
    id: str
    student_id: str
    personal_id: str
    name: str
    start_date: str
    end_date: Optional[str] = None
    objective: Optional[str] = None
    level: Optional[str] = None
    day_type: Optional[str] = None
    auto_archive: bool
    notes: Optional[str] = None
    status: str
    workouts_count: int = 0
    created_at: str
    updated_at: str

# ==================== EXERCISE LIBRARY MODELS ====================

class ExerciseLibraryCreate(BaseModel):
    name: str
    category: str  # From EXERCISE_CATEGORIES
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    instructions: Optional[str] = None
    muscles_worked: Optional[List[str]] = None

class ExerciseLibraryResponse(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    instructions: Optional[str] = None
    muscles_worked: Optional[List[str]] = None
    personal_id: Optional[str] = None  # None = system exercise
    created_at: str

# ==================== FINANCIAL MODELS ====================

class FinancialPlanCreate(BaseModel):
    student_id: str
    name: str  # "Mensal", "Trimestral", etc.
    value: float
    due_day: int  # Day of month (1-31)
    start_date: str
    status: str = "active"  # "active", "inactive"

class FinancialPaymentCreate(BaseModel):
    student_id: str
    plan_id: Optional[str] = None
    amount: float
    due_date: str
    payment_date: Optional[str] = None
    status: str = "pending"  # "pending", "paid", "overdue"
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class FinancialPaymentUpdate(BaseModel):
    payment_date: Optional[str] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

# ==================== WORKOUT MODELS ====================

class ExerciseCreate(BaseModel):
    name: str
    muscle_group: str
    sets: int
    reps: str
    weight: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    description: Optional[str] = None

class WorkoutDayCreate(BaseModel):
    day_name: str
    exercises: List[ExerciseCreate]

class WorkoutCreate(BaseModel):
    name: str
    student_id: str
    routine_id: Optional[str] = None
    days: List[WorkoutDayCreate]

class WorkoutResponse(BaseModel):
    id: str
    name: str
    student_id: str
    personal_id: str
    routine_id: Optional[str] = None
    days: List[dict]
    created_at: str
    updated_at: str
    version: int

# ==================== PROGRESS MODELS ====================

class ProgressLog(BaseModel):
    workout_id: str
    exercise_name: str
    sets_completed: List[dict]
    notes: Optional[str] = None
    difficulty: Optional[int] = None  # 1-5 scale

class ProgressResponse(BaseModel):
    id: str
    student_id: str
    workout_id: str
    exercise_name: str
    sets_completed: List[dict]
    notes: Optional[str] = None
    difficulty: Optional[int] = None
    logged_at: str

# ==================== CHECK-IN MODELS ====================

class CheckInCreate(BaseModel):
    notes: Optional[str] = None

class CheckInResponse(BaseModel):
    id: str
    student_id: str
    check_in_time: str
    notes: Optional[str] = None

# ==================== NOTIFICATION MODELS ====================

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: str

# ==================== EVOLUTION PHOTO MODELS ====================

class EvolutionPhotoResponse(BaseModel):
    id: str
    student_id: str
    photo_url: str
    date: str
    notes: Optional[str] = None
    created_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_personal_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "personal":
        raise HTTPException(status_code=403, detail="Acesso restrito a personal trainers")
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "password": hash_password(user.password),
        "role": "personal",
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, "personal")
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user.email,
            name=user.name,
            role="personal",
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = create_token(user["id"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            personal_id=user.get("personal_id"),
            phone=user.get("phone"),
            notes=user.get("notes"),
            birth_date=user.get("birth_date"),
            gender=user.get("gender"),
            objective=user.get("objective"),
            medical_restrictions=user.get("medical_restrictions"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        personal_id=current_user.get("personal_id"),
        phone=current_user.get("phone"),
        notes=current_user.get("notes"),
        birth_date=current_user.get("birth_date"),
        gender=current_user.get("gender"),
        objective=current_user.get("objective"),
        medical_restrictions=current_user.get("medical_restrictions"),
        created_at=current_user["created_at"]
    )

# ==================== STUDENT MANAGEMENT ====================

@api_router.post("/students", response_model=UserResponse)
async def create_student(student: StudentCreate, personal: dict = Depends(get_personal_user)):
    existing = await db.users.find_one({"email": student.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    student_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    student_doc = {
        "id": student_id,
        "email": student.email,
        "name": student.name,
        "password": hash_password(student.password),
        "role": "student",
        "personal_id": personal["id"],
        "phone": student.phone,
        "notes": student.notes,
        "birth_date": student.birth_date,
        "gender": student.gender,
        "objective": student.objective,
        "medical_restrictions": student.medical_restrictions,
        "emergency_contact": student.emergency_contact,
        "address": student.address,
        "created_at": now
    }
    
    await db.users.insert_one(student_doc)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": student_id,
        "title": "Bem-vindo!",
        "message": f"Você foi cadastrado por {personal['name']}. Aguarde seu treino!",
        "type": "info",
        "read": False,
        "created_at": now
    })
    
    return UserResponse(
        id=student_id,
        email=student.email,
        name=student.name,
        role="student",
        personal_id=personal["id"],
        phone=student.phone,
        notes=student.notes,
        birth_date=student.birth_date,
        gender=student.gender,
        objective=student.objective,
        medical_restrictions=student.medical_restrictions,
        emergency_contact=student.emergency_contact,
        address=student.address,
        created_at=now
    )

@api_router.get("/students", response_model=List[UserResponse])
async def list_students(personal: dict = Depends(get_personal_user)):
    students = await db.users.find(
        {"role": "student", "personal_id": personal["id"]},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return [UserResponse(
        id=s["id"],
        email=s["email"],
        name=s["name"],
        role=s["role"],
        personal_id=s.get("personal_id"),
        phone=s.get("phone"),
        notes=s.get("notes"),
        birth_date=s.get("birth_date"),
        gender=s.get("gender"),
        objective=s.get("objective"),
        medical_restrictions=s.get("medical_restrictions"),
        emergency_contact=s.get("emergency_contact"),
        address=s.get("address"),
        created_at=s["created_at"]
    ) for s in students]

@api_router.get("/students/{student_id}", response_model=UserResponse)
async def get_student(student_id: str, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    return UserResponse(
        id=student["id"],
        email=student["email"],
        name=student["name"],
        role=student["role"],
        personal_id=student.get("personal_id"),
        phone=student.get("phone"),
        notes=student.get("notes"),
        birth_date=student.get("birth_date"),
        gender=student.get("gender"),
        objective=student.get("objective"),
        medical_restrictions=student.get("medical_restrictions"),
        emergency_contact=student.get("emergency_contact"),
        address=student.get("address"),
        created_at=student["created_at"]
    )

@api_router.put("/students/{student_id}", response_model=UserResponse)
async def update_student(student_id: str, update: StudentUpdate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": student_id}, {"$set": update_data})
    
    updated = await db.users.find_one({"id": student_id}, {"_id": 0, "password": 0})
    return UserResponse(
        id=updated["id"],
        email=updated["email"],
        name=updated["name"],
        role=updated["role"],
        personal_id=updated.get("personal_id"),
        phone=updated.get("phone"),
        notes=updated.get("notes"),
        birth_date=updated.get("birth_date"),
        gender=updated.get("gender"),
        objective=updated.get("objective"),
        medical_restrictions=updated.get("medical_restrictions"),
        emergency_contact=updated.get("emergency_contact"),
        address=updated.get("address"),
        created_at=updated["created_at"]
    )

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.users.delete_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    await db.workouts.delete_many({"student_id": student_id})
    await db.progress.delete_many({"student_id": student_id})
    await db.notifications.delete_many({"user_id": student_id})
    await db.assessments.delete_many({"student_id": student_id})
    await db.routines.delete_many({"student_id": student_id})
    await db.payments.delete_many({"student_id": student_id})
    await db.plans.delete_many({"student_id": student_id})
    await db.checkins.delete_many({"student_id": student_id})
    await db.evolution_photos.delete_many({"student_id": student_id})
    
    return {"message": "Aluno removido com sucesso"}

# ==================== PHYSICAL ASSESSMENTS ====================

@api_router.post("/assessments", response_model=PhysicalAssessmentResponse)
async def create_assessment(assessment: PhysicalAssessmentCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": assessment.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    assessment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate BMI if weight and height are provided
    bmi = None
    if assessment.weight and assessment.height:
        height_m = assessment.height / 100
        bmi = round(assessment.weight / (height_m ** 2), 2)
    
    assessment_doc = {
        "id": assessment_id,
        "student_id": assessment.student_id,
        "personal_id": personal["id"],
        **assessment.model_dump(),
        "bmi": bmi or assessment.bmi,
        "created_at": now
    }
    
    await db.assessments.insert_one(assessment_doc)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": assessment.student_id,
        "title": "Nova Avaliação Física",
        "message": f"Uma nova avaliação foi registrada em {assessment.date}",
        "type": "info",
        "read": False,
        "created_at": now
    })
    
    return PhysicalAssessmentResponse(**assessment_doc)

@api_router.get("/assessments", response_model=List[PhysicalAssessmentResponse])
async def list_assessments(
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
        if student_id:
            query["student_id"] = student_id
    else:
        query["student_id"] = current_user["id"]
    
    assessments = await db.assessments.find(query, {"_id": 0}).sort("date", -1).to_list(100)
    return [PhysicalAssessmentResponse(**a) for a in assessments]

@api_router.get("/assessments/{assessment_id}", response_model=PhysicalAssessmentResponse)
async def get_assessment(assessment_id: str, current_user: dict = Depends(get_current_user)):
    query = {"id": assessment_id}
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    assessment = await db.assessments.find_one(query, {"_id": 0})
    if not assessment:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return PhysicalAssessmentResponse(**assessment)

@api_router.delete("/assessments/{assessment_id}")
async def delete_assessment(assessment_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.assessments.delete_one({"id": assessment_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return {"message": "Avaliação removida com sucesso"}

@api_router.get("/assessments/compare/{student_id}")
async def compare_assessments(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "personal":
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    else:
        if student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
    
    assessments = await db.assessments.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("date", 1).to_list(100)
    
    if len(assessments) < 2:
        return {"message": "É necessário pelo menos 2 avaliações para comparar", "assessments": assessments}
    
    first = assessments[0]
    last = assessments[-1]
    
    comparison = {
        "first_assessment": first,
        "last_assessment": last,
        "changes": {}
    }
    
    fields_to_compare = ["weight", "body_fat_percentage", "muscle_mass", "chest", "waist", "hip", 
                         "arm_right", "arm_left", "thigh_right", "thigh_left"]
    
    for field in fields_to_compare:
        if first.get(field) and last.get(field):
            change = last[field] - first[field]
            comparison["changes"][field] = {
                "initial": first[field],
                "current": last[field],
                "change": round(change, 2),
                "percentage": round((change / first[field]) * 100, 2) if first[field] != 0 else 0
            }
    
    return comparison

# ==================== TRAINING ROUTINES ====================

@api_router.post("/routines", response_model=TrainingRoutineResponse)
async def create_routine(routine: TrainingRoutineCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": routine.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    routine_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    routine_doc = {
        "id": routine_id,
        "student_id": routine.student_id,
        "personal_id": personal["id"],
        **routine.model_dump(),
        "status": "active",
        "created_at": now,
        "updated_at": now
    }
    
    await db.routines.insert_one(routine_doc)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": routine.student_id,
        "title": "Nova Rotina de Treino",
        "message": f"Uma nova rotina '{routine.name}' foi criada para você!",
        "type": "workout",
        "read": False,
        "created_at": now
    })
    
    return TrainingRoutineResponse(**routine_doc, workouts_count=0)

@api_router.get("/routines", response_model=List[TrainingRoutineResponse])
async def list_routines(
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
        if student_id:
            query["student_id"] = student_id
    else:
        query["student_id"] = current_user["id"]
    
    if status:
        query["status"] = status
    
    routines = await db.routines.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for r in routines:
        workouts_count = await db.workouts.count_documents({"routine_id": r["id"]})
        result.append(TrainingRoutineResponse(**r, workouts_count=workouts_count))
    
    return result

@api_router.get("/routines/{routine_id}", response_model=TrainingRoutineResponse)
async def get_routine(routine_id: str, current_user: dict = Depends(get_current_user)):
    query = {"id": routine_id}
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    routine = await db.routines.find_one(query, {"_id": 0})
    if not routine:
        raise HTTPException(status_code=404, detail="Rotina não encontrada")
    
    workouts_count = await db.workouts.count_documents({"routine_id": routine_id})
    return TrainingRoutineResponse(**routine, workouts_count=workouts_count)

@api_router.put("/routines/{routine_id}", response_model=TrainingRoutineResponse)
async def update_routine(routine_id: str, update: TrainingRoutineUpdate, personal: dict = Depends(get_personal_user)):
    routine = await db.routines.find_one({"id": routine_id, "personal_id": personal["id"]})
    if not routine:
        raise HTTPException(status_code=404, detail="Rotina não encontrada")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.routines.update_one({"id": routine_id}, {"$set": update_data})
    
    updated = await db.routines.find_one({"id": routine_id}, {"_id": 0})
    workouts_count = await db.workouts.count_documents({"routine_id": routine_id})
    return TrainingRoutineResponse(**updated, workouts_count=workouts_count)

@api_router.post("/routines/{routine_id}/clone")
async def clone_routine(routine_id: str, student_id: str, personal: dict = Depends(get_personal_user)):
    routine = await db.routines.find_one({"id": routine_id, "personal_id": personal["id"]})
    if not routine:
        raise HTTPException(status_code=404, detail="Rotina não encontrada")
    
    student = await db.users.find_one({"id": student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    new_routine_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    new_routine = {
        **routine,
        "id": new_routine_id,
        "student_id": student_id,
        "name": f"{routine['name']} (Cópia)",
        "created_at": now,
        "updated_at": now
    }
    if "_id" in new_routine:
        del new_routine["_id"]
    
    await db.routines.insert_one(new_routine)
    
    # Clone associated workouts
    workouts = await db.workouts.find({"routine_id": routine_id}, {"_id": 0}).to_list(100)
    for w in workouts:
        new_workout = {
            **w,
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "routine_id": new_routine_id,
            "created_at": now,
            "updated_at": now
        }
        await db.workouts.insert_one(new_workout)
    
    return {"message": "Rotina clonada com sucesso", "new_routine_id": new_routine_id}

@api_router.delete("/routines/{routine_id}")
async def delete_routine(routine_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.routines.delete_one({"id": routine_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rotina não encontrada")
    
    await db.workouts.delete_many({"routine_id": routine_id})
    return {"message": "Rotina removida com sucesso"}

# ==================== EXERCISE LIBRARY ====================

@api_router.get("/exercise-library/categories")
async def get_exercise_categories():
    return {"categories": EXERCISE_CATEGORIES}

@api_router.post("/exercise-library", response_model=ExerciseLibraryResponse)
async def create_library_exercise(exercise: ExerciseLibraryCreate, personal: dict = Depends(get_personal_user)):
    exercise_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get default image if not provided
    image_url = exercise.image_url or get_exercise_image(exercise.name)
    
    exercise_doc = {
        "id": exercise_id,
        **exercise.model_dump(),
        "image_url": image_url,
        "personal_id": personal["id"],
        "created_at": now
    }
    
    await db.exercise_library.insert_one(exercise_doc)
    return ExerciseLibraryResponse(**exercise_doc)

@api_router.get("/exercise-library", response_model=List[ExerciseLibraryResponse])
async def list_library_exercises(
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Get system exercises and personal's custom exercises
    query = {
        "$or": [
            {"personal_id": None},
            {"personal_id": current_user["id"] if current_user["role"] == "personal" else current_user.get("personal_id")}
        ]
    }
    
    if category:
        query["category"] = category
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    exercises = await db.exercise_library.find(query, {"_id": 0}).sort("name", 1).to_list(500)
    return [ExerciseLibraryResponse(**e) for e in exercises]

@api_router.delete("/exercise-library/{exercise_id}")
async def delete_library_exercise(exercise_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.exercise_library.delete_one({"id": exercise_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exercício não encontrado ou é um exercício do sistema")
    return {"message": "Exercício removido com sucesso"}

# ==================== FINANCIAL ====================

@api_router.post("/financial/plans")
async def create_financial_plan(plan: FinancialPlanCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": plan.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    plan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    plan_doc = {
        "id": plan_id,
        "personal_id": personal["id"],
        **plan.model_dump(),
        "created_at": now
    }
    
    await db.plans.insert_one(plan_doc)
    return {"id": plan_id, **plan_doc}

@api_router.get("/financial/plans")
async def list_financial_plans(
    student_id: Optional[str] = None,
    personal: dict = Depends(get_personal_user)
):
    query = {"personal_id": personal["id"]}
    if student_id:
        query["student_id"] = student_id
    
    plans = await db.plans.find(query, {"_id": 0}).to_list(100)
    return plans

@api_router.delete("/financial/plans/{plan_id}")
async def delete_financial_plan(plan_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.plans.delete_one({"id": plan_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return {"message": "Plano removido com sucesso"}

@api_router.post("/financial/payments")
async def create_payment(payment: FinancialPaymentCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": payment.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    payment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    payment_doc = {
        "id": payment_id,
        "personal_id": personal["id"],
        **payment.model_dump(),
        "created_at": now
    }
    
    await db.payments.insert_one(payment_doc)
    
    # Remove _id from response
    payment_doc.pop("_id", None)
    return payment_doc

@api_router.get("/financial/payments")
async def list_payments(
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    personal: dict = Depends(get_personal_user)
):
    query = {"personal_id": personal["id"]}
    if student_id:
        query["student_id"] = student_id
    if status:
        query["status"] = status
    if start_date:
        query["due_date"] = {"$gte": start_date}
    if end_date:
        if "due_date" in query:
            query["due_date"]["$lte"] = end_date
        else:
            query["due_date"] = {"$lte": end_date}
    
    payments = await db.payments.find(query, {"_id": 0}).sort("due_date", -1).to_list(500)
    return payments

@api_router.put("/financial/payments/{payment_id}")
async def update_payment(payment_id: str, update: FinancialPaymentUpdate, personal: dict = Depends(get_personal_user)):
    payment = await db.payments.find_one({"id": payment_id, "personal_id": personal["id"]})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.payments.update_one({"id": payment_id}, {"$set": update_data})
    
    updated = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    return updated

@api_router.delete("/financial/payments/{payment_id}")
async def delete_payment(payment_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.payments.delete_one({"id": payment_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return {"message": "Pagamento removido com sucesso"}

@api_router.get("/financial/summary")
async def get_financial_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    personal: dict = Depends(get_personal_user)
):
    query = {"personal_id": personal["id"]}
    
    if start_date or end_date:
        query["due_date"] = {}
        if start_date:
            query["due_date"]["$gte"] = start_date
        if end_date:
            query["due_date"]["$lte"] = end_date
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    
    total_received = sum(p["amount"] for p in payments if p["status"] == "paid")
    total_pending = sum(p["amount"] for p in payments if p["status"] == "pending")
    total_overdue = sum(p["amount"] for p in payments if p["status"] == "overdue")
    
    return {
        "total_received": total_received,
        "total_pending": total_pending,
        "total_overdue": total_overdue,
        "payments_count": len(payments),
        "paid_count": len([p for p in payments if p["status"] == "paid"]),
        "pending_count": len([p for p in payments if p["status"] == "pending"]),
        "overdue_count": len([p for p in payments if p["status"] == "overdue"])
    }

@api_router.get("/financial/student/{student_id}")
async def get_student_financial(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "personal":
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        query = {"student_id": student_id, "personal_id": current_user["id"]}
    else:
        if student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
        query = {"student_id": student_id}
    
    payments = await db.payments.find(query, {"_id": 0}).sort("due_date", -1).to_list(100)
    plans = await db.plans.find({"student_id": student_id}, {"_id": 0}).to_list(10)
    
    total_received = sum(p["amount"] for p in payments if p["status"] == "paid")
    total_pending = sum(p["amount"] for p in payments if p["status"] in ["pending", "overdue"])
    
    return {
        "payments": payments,
        "plans": plans,
        "total_received": total_received,
        "total_pending": total_pending
    }

# ==================== CHECK-INS ====================

@api_router.post("/checkins", response_model=CheckInResponse)
async def create_checkin(checkin: CheckInCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos podem fazer check-in")
    
    checkin_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    checkin_doc = {
        "id": checkin_id,
        "student_id": current_user["id"],
        "check_in_time": now,
        "notes": checkin.notes
    }
    
    await db.checkins.insert_one(checkin_doc)
    return CheckInResponse(**checkin_doc)

@api_router.get("/checkins", response_model=List[CheckInResponse])
async def list_checkins(
    student_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == "personal":
        if student_id:
            student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
            if not student:
                raise HTTPException(status_code=404, detail="Aluno não encontrado")
            query["student_id"] = student_id
        else:
            students = await db.users.find({"personal_id": current_user["id"], "role": "student"}, {"id": 1}).to_list(1000)
            student_ids = [s["id"] for s in students]
            query["student_id"] = {"$in": student_ids}
    else:
        query["student_id"] = current_user["id"]
    
    if start_date or end_date:
        query["check_in_time"] = {}
        if start_date:
            query["check_in_time"]["$gte"] = start_date
        if end_date:
            query["check_in_time"]["$lte"] = end_date + "T23:59:59"
    
    checkins = await db.checkins.find(query, {"_id": 0}).sort("check_in_time", -1).to_list(500)
    return [CheckInResponse(**c) for c in checkins]

@api_router.get("/checkins/frequency/{student_id}")
async def get_student_frequency(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "personal":
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    else:
        if student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get check-ins for the last 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    checkins = await db.checkins.find(
        {"student_id": student_id, "check_in_time": {"$gte": thirty_days_ago}},
        {"_id": 0}
    ).to_list(100)
    
    # Group by date
    dates = {}
    for c in checkins:
        date = c["check_in_time"][:10]
        if date not in dates:
            dates[date] = 0
        dates[date] += 1
    
    return {
        "total_checkins": len(checkins),
        "unique_days": len(dates),
        "frequency_by_date": dates
    }

# ==================== EVOLUTION PHOTOS ====================

@api_router.post("/evolution-photos")
async def upload_evolution_photo(
    student_id: str = Form(...),
    date: str = Form(...),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    personal: dict = Depends(get_personal_user)
):
    student = await db.users.find_one({"id": student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Apenas imagens são aceitas")
    
    photo_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    file_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    file_name = f"evolution_{student_id}_{photo_id}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    photo_doc = {
        "id": photo_id,
        "student_id": student_id,
        "personal_id": personal["id"],
        "photo_url": f"/uploads/{file_name}",
        "date": date,
        "notes": notes,
        "created_at": now
    }
    
    await db.evolution_photos.insert_one(photo_doc)
    return EvolutionPhotoResponse(**photo_doc)

@api_router.get("/evolution-photos/{student_id}", response_model=List[EvolutionPhotoResponse])
async def list_evolution_photos(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "personal":
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    else:
        if student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
    
    photos = await db.evolution_photos.find({"student_id": student_id}, {"_id": 0}).sort("date", -1).to_list(100)
    return [EvolutionPhotoResponse(**p) for p in photos]

@api_router.delete("/evolution-photos/{photo_id}")
async def delete_evolution_photo(photo_id: str, personal: dict = Depends(get_personal_user)):
    photo = await db.evolution_photos.find_one({"id": photo_id, "personal_id": personal["id"]})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    # Delete file
    file_path = ROOT_DIR / photo["photo_url"].lstrip("/")
    if file_path.exists():
        file_path.unlink()
    
    await db.evolution_photos.delete_one({"id": photo_id})
    return {"message": "Foto removida com sucesso"}

# ==================== WORKOUT MANAGEMENT ====================

@api_router.post("/workouts/upload")
async def upload_workout(
    file: UploadFile = File(...),
    student_id: str = None,
    routine_id: Optional[str] = None,
    personal: dict = Depends(get_personal_user)
):
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Apenas arquivos .xls ou .xlsx são aceitos")
    
    if student_id:
        student = await db.users.find_one({"id": student_id, "personal_id": personal["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    try:
        content = await file.read()
        df = pd.read_excel(BytesIO(content))
        
        required_cols = ['Dia', 'Exercício', 'Séries', 'Repetições']
        df.columns = df.columns.str.strip()
        
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            raise HTTPException(
                status_code=400, 
                detail=f"Colunas obrigatórias não encontradas: {', '.join(missing)}. Colunas encontradas: {', '.join(df.columns.tolist())}"
            )
        
        days = []
        for day_name in df['Dia'].unique():
            if pd.isna(day_name):
                continue
            day_df = df[df['Dia'] == day_name]
            exercises = []
            
            for _, row in day_df.iterrows():
                exercise_name = str(row.get('Exercício', '')).strip()
                exercise = {
                    "name": exercise_name,
                    "muscle_group": str(row.get('Grupo Muscular', '')).strip() if pd.notna(row.get('Grupo Muscular')) else '',
                    "sets": int(row.get('Séries', 3)) if pd.notna(row.get('Séries')) else 3,
                    "reps": str(row.get('Repetições', '10')).strip(),
                    "weight": str(row.get('Carga', '')).strip() if pd.notna(row.get('Carga')) else None,
                    "notes": str(row.get('Observações', '')).strip() if pd.notna(row.get('Observações')) else None,
                    "image_url": get_exercise_image(exercise_name),
                    "video_url": None,
                    "description": str(row.get('Descrição', '')).strip() if pd.notna(row.get('Descrição')) else None,
                    "rest_time": 90
                }
                exercises.append(exercise)
            
            days.append({
                "day_name": str(day_name).strip(),
                "exercises": exercises
            })
        
        workout_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        workout_doc = {
            "id": workout_id,
            "name": file.filename.rsplit('.', 1)[0],
            "student_id": student_id,
            "personal_id": personal["id"],
            "routine_id": routine_id,
            "days": days,
            "created_at": now,
            "updated_at": now,
            "version": 1
        }
        
        if student_id:
            existing = await db.workouts.find_one(
                {"student_id": student_id, "personal_id": personal["id"], "routine_id": routine_id},
                sort=[("version", -1)]
            )
            if existing:
                workout_doc["version"] = existing.get("version", 0) + 1
                await db.workouts.update_one(
                    {"id": existing["id"]},
                    {"$set": {"archived": True}}
                )
        
        await db.workouts.insert_one(workout_doc)
        
        if student_id:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": student_id,
                "title": "Novo Treino!",
                "message": f"Seu personal atualizou seu treino: {workout_doc['name']}",
                "type": "workout",
                "read": False,
                "created_at": now
            })
        
        return {
            "id": workout_id,
            "name": workout_doc["name"],
            "days_count": len(days),
            "exercises_count": sum(len(d["exercises"]) for d in days),
            "days": days
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="Arquivo vazio ou inválido")
    except Exception as e:
        logger.error(f"Error parsing file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")

@api_router.post("/workouts", response_model=WorkoutResponse)
async def create_workout(workout: WorkoutCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": workout.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    workout_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    workout_doc = {
        "id": workout_id,
        "name": workout.name,
        "student_id": workout.student_id,
        "personal_id": personal["id"],
        "routine_id": workout.routine_id,
        "days": [d.model_dump() for d in workout.days],
        "created_at": now,
        "updated_at": now,
        "version": 1
    }
    
    await db.workouts.insert_one(workout_doc)
    
    return WorkoutResponse(
        id=workout_id,
        name=workout.name,
        student_id=workout.student_id,
        personal_id=personal["id"],
        routine_id=workout.routine_id,
        days=workout_doc["days"],
        created_at=now,
        updated_at=now,
        version=1
    )

@api_router.get("/workouts", response_model=List[WorkoutResponse])
async def list_workouts(
    student_id: Optional[str] = None,
    routine_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"archived": {"$ne": True}}
    
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
        if student_id:
            query["student_id"] = student_id
    else:
        query["student_id"] = current_user["id"]
    
    if routine_id:
        query["routine_id"] = routine_id
    
    workouts = await db.workouts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for w in workouts:
        try:
            result.append(WorkoutResponse(
                id=w["id"],
                name=w["name"],
                student_id=w.get("student_id") or "",
                personal_id=w["personal_id"],
                routine_id=w.get("routine_id"),
                days=w.get("days", []),
                created_at=w["created_at"],
                updated_at=w.get("updated_at", w["created_at"]),
                version=w.get("version", 1)
            ))
        except Exception as e:
            logger.error(f"Error processing workout {w.get('id')}: {e}")
            continue
    
    return result

@api_router.get("/workouts/{workout_id}", response_model=WorkoutResponse)
async def get_workout(workout_id: str, current_user: dict = Depends(get_current_user)):
    query = {"id": workout_id}
    
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    workout = await db.workouts.find_one(query, {"_id": 0})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    return WorkoutResponse(
        id=workout["id"],
        name=workout["name"],
        student_id=workout["student_id"],
        personal_id=workout["personal_id"],
        routine_id=workout.get("routine_id"),
        days=workout["days"],
        created_at=workout["created_at"],
        updated_at=workout["updated_at"],
        version=workout.get("version", 1)
    )

@api_router.put("/workouts/{workout_id}/exercise-image")
async def update_exercise_image(workout_id: str, day_index: int, exercise_index: int, image_url: str, personal: dict = Depends(get_personal_user)):
    workout = await db.workouts.find_one({"id": workout_id, "personal_id": personal["id"]})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    days = workout["days"]
    if day_index < len(days) and exercise_index < len(days[day_index]["exercises"]):
        days[day_index]["exercises"][exercise_index]["image_url"] = image_url
        
        await db.workouts.update_one(
            {"id": workout_id},
            {"$set": {"days": days, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"message": "Imagem atualizada com sucesso"}
    
    raise HTTPException(status_code=400, detail="Índice inválido")

@api_router.post("/workouts/{workout_id}/upload-image")
async def upload_exercise_image(
    workout_id: str,
    day_index: int = Form(...),
    exercise_index: int = Form(...),
    file: UploadFile = File(...),
    personal: dict = Depends(get_personal_user)
):
    workout = await db.workouts.find_one({"id": workout_id, "personal_id": personal["id"]})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    days = workout["days"]
    if day_index >= len(days) or exercise_index >= len(days[day_index]["exercises"]):
        raise HTTPException(status_code=400, detail="Índice inválido")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Apenas imagens são aceitas")
    
    file_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    file_name = f"{workout_id}_{day_index}_{exercise_index}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    image_url = f"/uploads/{file_name}"
    days[day_index]["exercises"][exercise_index]["image_url"] = image_url
    
    await db.workouts.update_one(
        {"id": workout_id},
        {"$set": {"days": days, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Imagem enviada com sucesso", "image_url": image_url}

@api_router.delete("/workouts/{workout_id}")
async def delete_workout(workout_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.workouts.delete_one({"id": workout_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    return {"message": "Treino removido com sucesso"}

# ==================== PROGRESS TRACKING ====================

@api_router.post("/progress", response_model=ProgressResponse)
async def log_progress(progress: ProgressLog, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos podem registrar progresso")
    
    progress_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    progress_doc = {
        "id": progress_id,
        "student_id": current_user["id"],
        "workout_id": progress.workout_id,
        "exercise_name": progress.exercise_name,
        "sets_completed": progress.sets_completed,
        "notes": progress.notes,
        "difficulty": progress.difficulty,
        "logged_at": now
    }
    
    await db.progress.insert_one(progress_doc)
    
    return ProgressResponse(
        id=progress_id,
        student_id=current_user["id"],
        workout_id=progress.workout_id,
        exercise_name=progress.exercise_name,
        sets_completed=progress.sets_completed,
        notes=progress.notes,
        difficulty=progress.difficulty,
        logged_at=now
    )

@api_router.get("/progress", response_model=List[ProgressResponse])
async def get_progress(
    exercise_name: Optional[str] = None,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    else:
        if student_id:
            student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
            if not student:
                raise HTTPException(status_code=404, detail="Aluno não encontrado")
            query["student_id"] = student_id
    
    if exercise_name:
        query["exercise_name"] = exercise_name
    
    progress_list = await db.progress.find(query, {"_id": 0}).sort("logged_at", -1).to_list(500)
    
    return [ProgressResponse(
        id=p["id"],
        student_id=p["student_id"],
        workout_id=p["workout_id"],
        exercise_name=p["exercise_name"],
        sets_completed=p["sets_completed"],
        notes=p.get("notes"),
        difficulty=p.get("difficulty"),
        logged_at=p["logged_at"]
    ) for p in progress_list]

@api_router.get("/progress/evolution")
async def get_evolution(
    exercise_name: str,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"exercise_name": exercise_name}
    
    if current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    else:
        if student_id:
            student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
            if not student:
                raise HTTPException(status_code=404, detail="Aluno não encontrado")
            query["student_id"] = student_id
    
    progress_list = await db.progress.find(query, {"_id": 0}).sort("logged_at", 1).to_list(500)
    
    evolution_data = []
    for p in progress_list:
        if p["sets_completed"]:
            max_weight = max((s.get("weight", 0) for s in p["sets_completed"]), default=0)
            total_reps = sum(s.get("reps", 0) for s in p["sets_completed"])
            evolution_data.append({
                "date": p["logged_at"][:10],
                "weight": max_weight,
                "reps": total_reps,
                "exercise": exercise_name
            })
    
    return evolution_data

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return [NotificationResponse(
        id=n["id"],
        user_id=n["user_id"],
        title=n["title"],
        message=n["message"],
        type=n["type"],
        read=n["read"],
        created_at=n["created_at"]
    ) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    return {"message": "Notificação marcada como lida"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Todas notificações marcadas como lidas"}

# ==================== STATS ====================

@api_router.get("/stats/personal")
async def get_personal_stats(personal: dict = Depends(get_personal_user)):
    students_count = await db.users.count_documents({"personal_id": personal["id"], "role": "student"})
    workouts_count = await db.workouts.count_documents({"personal_id": personal["id"], "archived": {"$ne": True}})
    routines_count = await db.routines.count_documents({"personal_id": personal["id"], "status": "active"})
    
    student_ids = [s["id"] async for s in db.users.find({"personal_id": personal["id"], "role": "student"}, {"id": 1})]
    recent_progress = await db.progress.count_documents({
        "student_id": {"$in": student_ids},
        "logged_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
    })
    
    # Financial stats
    payments = await db.payments.find({"personal_id": personal["id"]}, {"_id": 0}).to_list(1000)
    total_received = sum(p["amount"] for p in payments if p["status"] == "paid")
    total_pending = sum(p["amount"] for p in payments if p["status"] in ["pending", "overdue"])
    
    return {
        "students_count": students_count,
        "workouts_count": workouts_count,
        "routines_count": routines_count,
        "recent_progress": recent_progress,
        "total_received": total_received,
        "total_pending": total_pending
    }

@api_router.get("/stats/student")
async def get_student_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    workouts = await db.workouts.find(
        {"student_id": current_user["id"], "archived": {"$ne": True}},
        {"_id": 0}
    ).to_list(10)
    
    total_exercises = sum(len(e) for w in workouts for d in w.get("days", []) for e in [d.get("exercises", [])])
    progress_count = await db.progress.count_documents({"student_id": current_user["id"]})
    
    streak = 0
    today = datetime.now(timezone.utc).date()
    for i in range(30):
        check_date = (today - timedelta(days=i)).isoformat()
        has_progress = await db.progress.find_one({
            "student_id": current_user["id"],
            "logged_at": {"$gte": check_date, "$lt": (today - timedelta(days=i-1)).isoformat() if i > 0 else check_date + "T23:59:59"}
        })
        if has_progress:
            streak += 1
        elif i > 0:
            break
    
    return {
        "total_exercises": total_exercises,
        "progress_logged": progress_count,
        "workout_streak": streak,
        "has_workout": len(workouts) > 0
    }

# ==================== CHAT ====================

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    content: str
    read: bool
    created_at: str

@api_router.post("/chat/messages", response_model=MessageResponse)
async def send_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    receiver = await db.users.find_one({"id": message.receiver_id}, {"_id": 0, "password": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="Destinatário não encontrado")
    
    if current_user["role"] == "personal":
        if receiver.get("personal_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Você só pode enviar mensagens para seus alunos")
    else:
        if current_user.get("personal_id") != receiver["id"]:
            raise HTTPException(status_code=403, detail="Você só pode enviar mensagens para seu personal")
    
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    message_doc = {
        "id": message_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "receiver_id": message.receiver_id,
        "content": message.content,
        "read": False,
        "created_at": now
    }
    
    await db.messages.insert_one(message_doc)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": message.receiver_id,
        "title": "Nova mensagem",
        "message": f"{current_user['name']}: {message.content[:50]}{'...' if len(message.content) > 50 else ''}",
        "type": "info",
        "read": False,
        "created_at": now
    })
    
    return MessageResponse(**message_doc)

@api_router.get("/chat/messages/{user_id}", response_model=List[MessageResponse])
async def get_messages(user_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["id"], "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": current_user["id"]}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(500)
    
    await db.messages.update_many(
        {"sender_id": user_id, "receiver_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return [MessageResponse(**m) for m in messages]

@api_router.get("/chat/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "personal":
        students = await db.users.find(
            {"personal_id": current_user["id"], "role": "student"},
            {"_id": 0, "password": 0}
        ).to_list(100)
        
        conversations = []
        for student in students:
            last_msg = await db.messages.find_one(
                {"$or": [
                    {"sender_id": current_user["id"], "receiver_id": student["id"]},
                    {"sender_id": student["id"], "receiver_id": current_user["id"]}
                ]},
                sort=[("created_at", -1)]
            )
            
            unread = await db.messages.count_documents({
                "sender_id": student["id"],
                "receiver_id": current_user["id"],
                "read": False
            })
            
            conversations.append({
                "user_id": student["id"],
                "user_name": student["name"],
                "last_message": last_msg["content"] if last_msg else None,
                "last_message_time": last_msg["created_at"] if last_msg else None,
                "unread_count": unread
            })
        
        return conversations
    else:
        personal = await db.users.find_one(
            {"id": current_user.get("personal_id")},
            {"_id": 0, "password": 0}
        )
        
        if not personal:
            return []
        
        last_msg = await db.messages.find_one(
            {"$or": [
                {"sender_id": current_user["id"], "receiver_id": personal["id"]},
                {"sender_id": personal["id"], "receiver_id": current_user["id"]}
            ]},
            sort=[("created_at", -1)]
        )
        
        unread = await db.messages.count_documents({
            "sender_id": personal["id"],
            "receiver_id": current_user["id"],
            "read": False
        })
        
        return [{
            "user_id": personal["id"],
            "user_name": personal["name"],
            "last_message": last_msg["content"] if last_msg else None,
            "last_message_time": last_msg["created_at"] if last_msg else None,
            "unread_count": unread
        }]

# ==================== EXERCISE VIDEOS ====================

@api_router.get("/exercises/video/{exercise_name}")
async def get_exercise_video(exercise_name: str):
    name_lower = exercise_name.lower().strip()
    
    if name_lower in EXERCISE_VIDEOS:
        return {"video_url": EXERCISE_VIDEOS[name_lower]}
    
    for key, url in EXERCISE_VIDEOS.items():
        if key in name_lower or name_lower in key:
            return {"video_url": url}
    
    return {"video_url": None}

@api_router.get("/exercises/search")
async def search_exercises(q: str, current_user: dict = Depends(get_current_user)):
    results = []
    q_lower = q.lower()
    
    for name, image_url in EXERCISE_IMAGES.items():
        if q_lower in name:
            results.append({
                "name": name.title(),
                "image_url": image_url
            })
    
    return results[:10]

# ==================== PDF EXPORT ====================

@api_router.get("/reports/student/{student_id}")
async def get_student_report(student_id: str, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    workouts = await db.workouts.find(
        {"student_id": student_id, "archived": {"$ne": True}},
        {"_id": 0}
    ).to_list(10)
    
    progress = await db.progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("logged_at", -1).to_list(100)
    
    assessments = await db.assessments.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("date", -1).to_list(10)
    
    total_workouts = len(progress)
    exercises_done = len(set(p["exercise_name"] for p in progress))
    
    evolution = {}
    for p in progress:
        ex_name = p["exercise_name"]
        if ex_name not in evolution:
            evolution[ex_name] = []
        if p["sets_completed"]:
            max_weight = max((s.get("weight", 0) for s in p["sets_completed"]), default=0)
            evolution[ex_name].append({
                "date": p["logged_at"][:10],
                "weight": max_weight
            })
    
    return {
        "student": student,
        "workouts": workouts,
        "progress_count": total_workouts,
        "exercises_count": exercises_done,
        "evolution": evolution,
        "assessments": assessments,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

# ==================== GAMIFICATION ====================

BADGES = {
    "first_workout": {"id": "first_workout", "name": "Primeiro Treino", "description": "Completou seu primeiro treino", "icon": "trophy", "color": "yellow"},
    "streak_3": {"id": "streak_3", "name": "Consistente", "description": "3 dias seguidos de treino", "icon": "flame", "color": "orange"},
    "streak_7": {"id": "streak_7", "name": "Dedicado", "description": "7 dias seguidos de treino", "icon": "fire", "color": "red"},
    "streak_30": {"id": "streak_30", "name": "Imparável", "description": "30 dias seguidos de treino", "icon": "zap", "color": "purple"},
    "weight_up_10": {"id": "weight_up_10", "name": "Força +10", "description": "Aumentou 10kg em um exercício", "icon": "trending-up", "color": "green"},
    "weight_up_25": {"id": "weight_up_25", "name": "Força +25", "description": "Aumentou 25kg em um exercício", "icon": "award", "color": "blue"},
    "exercises_10": {"id": "exercises_10", "name": "Variado", "description": "Registrou progresso em 10 exercícios diferentes", "icon": "grid", "color": "cyan"},
    "workouts_50": {"id": "workouts_50", "name": "Veterano", "description": "50 treinos registrados", "icon": "medal", "color": "gold"},
    "workouts_100": {"id": "workouts_100", "name": "Lenda", "description": "100 treinos registrados", "icon": "crown", "color": "platinum"}
}

async def calculate_badges(student_id: str) -> list:
    earned_badges = []
    
    progress_list = await db.progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("logged_at", 1).to_list(1000)
    
    if not progress_list:
        return earned_badges
    
    earned_badges.append(BADGES["first_workout"])
    
    total_workouts = len(progress_list)
    if total_workouts >= 50:
        earned_badges.append(BADGES["workouts_50"])
    if total_workouts >= 100:
        earned_badges.append(BADGES["workouts_100"])
    
    unique_exercises = len(set(p["exercise_name"] for p in progress_list))
    if unique_exercises >= 10:
        earned_badges.append(BADGES["exercises_10"])
    
    dates = sorted(set(p["logged_at"][:10] for p in progress_list))
    max_streak = 1
    current_streak = 1
    for i in range(1, len(dates)):
        prev_date = datetime.fromisoformat(dates[i-1])
        curr_date = datetime.fromisoformat(dates[i])
        if (curr_date - prev_date).days == 1:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 1
    
    if max_streak >= 3:
        earned_badges.append(BADGES["streak_3"])
    if max_streak >= 7:
        earned_badges.append(BADGES["streak_7"])
    if max_streak >= 30:
        earned_badges.append(BADGES["streak_30"])
    
    exercise_progress = {}
    for p in progress_list:
        ex_name = p["exercise_name"]
        if p["sets_completed"]:
            max_weight = max((s.get("weight", 0) for s in p["sets_completed"]), default=0)
            if ex_name not in exercise_progress:
                exercise_progress[ex_name] = {"first": max_weight, "last": max_weight}
            else:
                exercise_progress[ex_name]["last"] = max_weight
    
    max_improvement = 0
    for ex_name, data in exercise_progress.items():
        improvement = data["last"] - data["first"]
        max_improvement = max(max_improvement, improvement)
    
    if max_improvement >= 10:
        earned_badges.append(BADGES["weight_up_10"])
    if max_improvement >= 25:
        earned_badges.append(BADGES["weight_up_25"])
    
    return earned_badges

async def calculate_records(student_id: str) -> dict:
    progress_list = await db.progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).to_list(1000)
    
    records = {}
    for p in progress_list:
        ex_name = p["exercise_name"]
        if p["sets_completed"]:
            max_weight = max((s.get("weight", 0) for s in p["sets_completed"]), default=0)
            max_reps = max((s.get("reps", 0) for s in p["sets_completed"]), default=0)
            
            if ex_name not in records or max_weight > records[ex_name]["weight"]:
                records[ex_name] = {
                    "weight": max_weight,
                    "reps": max_reps,
                    "date": p["logged_at"][:10]
                }
    
    return records

@api_router.get("/gamification/badges")
async def get_badges(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    badges = await calculate_badges(current_user["id"])
    return {
        "earned": badges,
        "total_available": len(BADGES),
        "earned_count": len(badges)
    }

@api_router.get("/gamification/records")
async def get_records(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    records = await calculate_records(current_user["id"])
    return records

@api_router.get("/gamification/ranking")
async def get_ranking(personal: dict = Depends(get_personal_user)):
    students = await db.users.find(
        {"personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    ranking = []
    for student in students:
        progress_count = await db.progress.count_documents({"student_id": student["id"]})
        
        progress_list = await db.progress.find(
            {"student_id": student["id"]},
            {"logged_at": 1}
        ).sort("logged_at", -1).to_list(100)
        
        streak = 0
        if progress_list:
            dates = sorted(set(p["logged_at"][:10] for p in progress_list), reverse=True)
            today = datetime.now(timezone.utc).date()
            
            for i, date_str in enumerate(dates):
                check_date = today - timedelta(days=i)
                if date_str == check_date.isoformat():
                    streak += 1
                else:
                    break
        
        badges = await calculate_badges(student["id"])
        
        ranking.append({
            "student_id": student["id"],
            "student_name": student["name"],
            "progress_count": progress_count,
            "streak": streak,
            "badges_count": len(badges),
            "score": progress_count * 10 + streak * 5 + len(badges) * 20
        })
    
    ranking.sort(key=lambda x: x["score"], reverse=True)
    
    for i, r in enumerate(ranking):
        r["rank"] = i + 1
    
    return ranking

@api_router.get("/gamification/student/{student_id}")
async def get_student_gamification(student_id: str, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    badges = await calculate_badges(student_id)
    records = await calculate_records(student_id)
    
    return {
        "student": student,
        "badges": badges,
        "records": records,
        "badges_count": len(badges),
        "total_badges": len(BADGES)
    }

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Personal Trainer API v2.0"}

# Include router and add CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
