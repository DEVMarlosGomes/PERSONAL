from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
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

# ==================== EXERCISE IMAGE DATABASE ====================
# Pre-defined exercise images for common exercises
EXERCISE_IMAGES = {
    # Chest
    "supino reto": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "supino inclinado": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "supino declinado": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "crucifixo": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "crossover": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "flexão": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400",
    # Back
    "puxada": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "puxada frontal": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "remada": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "remada curvada": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "remada baixa": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "pulldown": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    # Shoulders
    "desenvolvimento": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400",
    "elevação lateral": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400",
    "elevação frontal": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400",
    # Biceps
    "rosca": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca direta": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca alternada": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca martelo": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca scott": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    # Triceps
    "tríceps": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps pulley": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps corda": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps testa": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps francês": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    # Legs
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
    # Abs
    "abdominal": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    "prancha": "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400",
    "crunch": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
}

def get_exercise_image(exercise_name: str) -> Optional[str]:
    """Get image URL for exercise based on name matching"""
    name_lower = exercise_name.lower().strip()
    
    # Direct match
    if name_lower in EXERCISE_IMAGES:
        return EXERCISE_IMAGES[name_lower]
    
    # Partial match
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
    role: str = "personal"  # "personal" or "student"

class StudentCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    phone: Optional[str] = None
    notes: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

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
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

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
    days: List[WorkoutDayCreate]

class WorkoutResponse(BaseModel):
    id: str
    name: str
    student_id: str
    personal_id: str
    days: List[dict]
    created_at: str
    updated_at: str
    version: int

class ProgressLog(BaseModel):
    workout_id: str
    exercise_name: str
    sets_completed: List[dict]  # [{set: 1, weight: 60, reps: 10}, ...]
    notes: Optional[str] = None

class ProgressResponse(BaseModel):
    id: str
    student_id: str
    workout_id: str
    exercise_name: str
    sets_completed: List[dict]
    notes: Optional[str] = None
    logged_at: str

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, success, warning, workout

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: str

class ExerciseImageUpdate(BaseModel):
    workout_id: str
    day_index: int
    exercise_index: int
    image_url: str

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
        "role": "personal",  # Register is only for personals
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
        "created_at": now
    }
    
    await db.users.insert_one(student_doc)
    
    # Create notification for student
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
        created_at=updated["created_at"]
    )

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.users.delete_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Delete associated workouts and progress
    await db.workouts.delete_many({"student_id": student_id})
    await db.progress.delete_many({"student_id": student_id})
    await db.notifications.delete_many({"user_id": student_id})
    
    return {"message": "Aluno removido com sucesso"}

# ==================== WORKOUT MANAGEMENT ====================

@api_router.post("/workouts/upload")
async def upload_workout(
    file: UploadFile = File(...),
    student_id: str = None,
    personal: dict = Depends(get_personal_user)
):
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Apenas arquivos .xls ou .xlsx são aceitos")
    
    # Verify student belongs to personal
    if student_id:
        student = await db.users.find_one({"id": student_id, "personal_id": personal["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    try:
        content = await file.read()
        df = pd.read_excel(BytesIO(content))
        
        # Expected columns: Dia, Grupo Muscular, Exercício, Séries, Repetições, Carga, Observações
        required_cols = ['Dia', 'Exercício', 'Séries', 'Repetições']
        
        # Normalize column names
        df.columns = df.columns.str.strip()
        
        # Check for required columns
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            raise HTTPException(
                status_code=400, 
                detail=f"Colunas obrigatórias não encontradas: {', '.join(missing)}. Colunas encontradas: {', '.join(df.columns.tolist())}"
            )
        
        # Group by day
        days = []
        for day_name in df['Dia'].unique():
            if pd.isna(day_name):
                continue
            day_df = df[df['Dia'] == day_name]
            exercises = []
            
            for _, row in day_df.iterrows():
                exercise = {
                    "name": str(row.get('Exercício', '')).strip(),
                    "muscle_group": str(row.get('Grupo Muscular', '')).strip() if pd.notna(row.get('Grupo Muscular')) else '',
                    "sets": int(row.get('Séries', 3)) if pd.notna(row.get('Séries')) else 3,
                    "reps": str(row.get('Repetições', '10')).strip(),
                    "weight": str(row.get('Carga', '')).strip() if pd.notna(row.get('Carga')) else None,
                    "notes": str(row.get('Observações', '')).strip() if pd.notna(row.get('Observações')) else None,
                    "image_url": None,
                    "video_url": None,
                    "description": str(row.get('Descrição', '')).strip() if pd.notna(row.get('Descrição')) else None
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
            "days": days,
            "created_at": now,
            "updated_at": now,
            "version": 1
        }
        
        # Check if student already has a workout - increment version
        if student_id:
            existing = await db.workouts.find_one(
                {"student_id": student_id, "personal_id": personal["id"]},
                sort=[("version", -1)]
            )
            if existing:
                workout_doc["version"] = existing.get("version", 0) + 1
                # Archive old workout
                await db.workouts.update_one(
                    {"id": existing["id"]},
                    {"$set": {"archived": True}}
                )
        
        await db.workouts.insert_one(workout_doc)
        
        # Notify student
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
    # Verify student belongs to personal
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
        days=workout_doc["days"],
        created_at=now,
        updated_at=now,
        version=1
    )

@api_router.get("/workouts", response_model=List[WorkoutResponse])
async def list_workouts(student_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"archived": {"$ne": True}}
    
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
        if student_id:
            query["student_id"] = student_id
    else:  # student
        query["student_id"] = current_user["id"]
    
    workouts = await db.workouts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return [WorkoutResponse(
        id=w["id"],
        name=w["name"],
        student_id=w["student_id"],
        personal_id=w["personal_id"],
        days=w["days"],
        created_at=w["created_at"],
        updated_at=w["updated_at"],
        version=w.get("version", 1)
    ) for w in workouts]

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
        days=workout["days"],
        created_at=workout["created_at"],
        updated_at=workout["updated_at"],
        version=workout.get("version", 1)
    )

@api_router.put("/workouts/{workout_id}/exercise-image")
async def update_exercise_image(workout_id: str, update: ExerciseImageUpdate, personal: dict = Depends(get_personal_user)):
    workout = await db.workouts.find_one({"id": workout_id, "personal_id": personal["id"]})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    # Update the specific exercise image
    days = workout["days"]
    if update.day_index < len(days) and update.exercise_index < len(days[update.day_index]["exercises"]):
        days[update.day_index]["exercises"][update.exercise_index]["image_url"] = update.image_url
        
        await db.workouts.update_one(
            {"id": workout_id},
            {"$set": {"days": days, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"message": "Imagem atualizada com sucesso"}
    
    raise HTTPException(status_code=400, detail="Índice inválido")

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
            # Verify student belongs to personal
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
    
    # Process data for chart
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
    
    # Get recent progress from all students
    student_ids = [s["id"] async for s in db.users.find({"personal_id": personal["id"], "role": "student"}, {"id": 1})]
    recent_progress = await db.progress.count_documents({
        "student_id": {"$in": student_ids},
        "logged_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
    })
    
    return {
        "students_count": students_count,
        "workouts_count": workouts_count,
        "recent_progress": recent_progress
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
    
    # Calculate streak (days in a row with progress)
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

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Personal Trainer API v1.0"}

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
