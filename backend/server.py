from fastapi import FastAPI, HTTPException, Depends, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import motor.motor_asyncio
import os
import hashlib
import hmac
import secrets
import jwt
import random
import uuid
import requests as http_requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Academy SaaS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", "24"))

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ---- Helper Functions ----
def str_id(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

def str_ids(docs):
    return [str_id(doc) for doc in docs]

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}:{hashed.hex()}"

def verify_password(password: str, stored: str) -> bool:
    salt, hashed = stored.split(":")
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return hmac.compare_digest(check.hex(), hashed)

def create_token(user_id: str, club_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "club_id": club_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = None):
    from fastapi import Request
    return None

from fastapi import Request

async def get_user_from_request(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = auth.split(" ")[1]
    payload = decode_token(token)
    user = await db.users.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "user_id": str(user["_id"]),
        "club_id": payload["club_id"],
        "role": payload["role"],
        "name": user.get("name", ""),
        "email": user.get("email", "")
    }

# ---- Object Storage ----
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "academyos"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = http_requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = http_requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = http_requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        print("Storage initialized successfully")
    except Exception as e:
        print(f"Storage init warning: {e}")

# ---- Pydantic Models ----
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    club_name: Optional[str] = None
    role: str = "admin"

class LoginRequest(BaseModel):
    email: str
    password: str

class PlayerCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str
    position: str
    team_id: Optional[str] = None
    category: str = "U12"
    jersey_number: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    status: str = "active"
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    preferred_foot: str = "right"

class TeamCreate(BaseModel):
    name: str
    category: str
    coach_id: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = "#22c55e"

class TrainingCreate(BaseModel):
    title: str
    team_id: str
    date: str
    start_time: str
    end_time: str
    location: Optional[str] = "Main Field"
    description: Optional[str] = None
    type: str = "regular"

class AttendanceRecord(BaseModel):
    player_id: str
    status: str = "present"

class MatchCreate(BaseModel):
    team_id: str
    opponent: str
    date: str
    time: str
    location: str
    type: str = "league"
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: str = "scheduled"
    notes: Optional[str] = None

class CalendarEventCreate(BaseModel):
    title: str
    type: str
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    description: Optional[str] = None
    team_id: Optional[str] = None

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "normal"
    target: str = "all"
    team_id: Optional[str] = None

class EvaluationCreate(BaseModel):
    player_id: str
    evaluator_name: Optional[str] = None
    technical: int = 5
    tactical: int = 5
    physical: int = 5
    mental: int = 5
    overall: int = 5
    notes: Optional[str] = None
    recommendation: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class ClubSettingsUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    founded_year: Optional[int] = None
    logo_url: Optional[str] = None

class LanguageUpdate(BaseModel):
    language: str

class NotificationCreate(BaseModel):
    subject: str
    message: str
    recipient: str = "all_parents"
    team_id: Optional[str] = None

class PlayerMetricCreate(BaseModel):
    player_id: str
    speed: Optional[float] = None
    stamina: Optional[float] = None
    strength: Optional[float] = None
    agility: Optional[float] = None
    technique: Optional[float] = None
    passing: Optional[float] = None
    shooting: Optional[float] = None
    dribbling: Optional[float] = None
    date: Optional[str] = None

class InjuryCreate(BaseModel):
    player_id: str
    type: str
    description: str
    date: str
    expected_return: Optional[str] = None
    status: str = "active"

class SeasonCreate(BaseModel):
    name: str
    start_date: str
    end_date: str
    description: Optional[str] = None
    status: str = "upcoming"

class SeasonUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

# ---- Routes ----

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Academy SaaS API"}

# AUTH
@app.post("/api/auth/signup")
async def signup(data: SignupRequest):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    club = None
    club_id = None
    if data.club_name:
        club_doc = {
            "name": data.club_name,
            "address": "",
            "phone": "",
            "email": data.email,
            "website": "",
            "founded_year": 2020,
            "logo_url": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.clubs.insert_one(club_doc)
        club_id = str(result.inserted_id)
    
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": data.role,
        "club_id": club_id,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    token = create_token(user_id, club_id or "", data.role)
    return {
        "token": token,
        "user": {"id": user_id, "name": data.name, "email": data.email, "role": data.role, "club_id": club_id}
    }

@app.post("/api/auth/login")
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    token = create_token(user_id, user.get("club_id", ""), user.get("role", "admin"))
    
    club = None
    if user.get("club_id"):
        club_doc = await db.clubs.find_one({"_id": ObjectId(user["club_id"])})
        if club_doc:
            club = {"id": str(club_doc["_id"]), "name": club_doc.get("name", "")}
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", "admin"),
            "club_id": user.get("club_id", ""),
            "club": club,
            "language": user.get("language", "en")
        }
    }

@app.get("/api/auth/me")
async def get_me(request: Request):
    user = await get_user_from_request(request)
    club = None
    if user["club_id"]:
        club_doc = await db.clubs.find_one({"_id": ObjectId(user["club_id"])})
        if club_doc:
            club = {"id": str(club_doc["_id"]), "name": club_doc.get("name", "")}
    return {**user, "club": club}

# DASHBOARD
@app.get("/api/dashboard")
async def get_dashboard(request: Request):
    user = await get_user_from_request(request)
    cid = user["club_id"]
    
    total_players = await db.players.count_documents({"club_id": cid})
    total_teams = await db.teams.count_documents({"club_id": cid})
    active_players = await db.players.count_documents({"club_id": cid, "status": "active"})
    injured_players = await db.players.count_documents({"club_id": cid, "status": "injured"})
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    upcoming_training = await db.training_sessions.count_documents({"club_id": cid, "date": {"$gte": today}})
    upcoming_matches = await db.matches.count_documents({"club_id": cid, "date": {"$gte": today}})
    
    # Players by category
    pipeline = [
        {"$match": {"club_id": cid}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    categories = await db.players.aggregate(pipeline).to_list(20)
    players_by_category = [{"name": c["_id"], "value": c["count"]} for c in categories]
    
    # Training attendance rate (last 10 sessions)
    recent_sessions = await db.training_sessions.find(
        {"club_id": cid}, {"_id": 1, "title": 1, "date": 1}
    ).sort("date", -1).limit(10).to_list(10)
    
    attendance_rates = []
    for session in reversed(recent_sessions):
        sid = str(session["_id"])
        total = await db.training_attendance.count_documents({"session_id": sid})
        present = await db.training_attendance.count_documents({"session_id": sid, "status": "present"})
        rate = round((present / total * 100) if total > 0 else 0)
        attendance_rates.append({
            "name": session.get("date", "")[:10],
            "rate": rate
        })
    
    # Recent announcements
    announcements = await db.announcements.find({"club_id": cid}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_players": total_players,
        "total_teams": total_teams,
        "active_players": active_players,
        "injured_players": injured_players,
        "upcoming_training": upcoming_training,
        "upcoming_matches": upcoming_matches,
        "players_by_category": players_by_category,
        "attendance_rates": attendance_rates,
        "recent_announcements": str_ids(announcements)
    }

# PLAYERS
@app.get("/api/players")
async def get_players(request: Request, search: str = "", category: str = "", team_id: str = "", status: str = ""):
    user = await get_user_from_request(request)
    query = {"club_id": user["club_id"]}
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}}
        ]
    if category:
        query["category"] = category
    if team_id:
        query["team_id"] = team_id
    if status:
        query["status"] = status
    
    players = await db.players.find(query).sort("last_name", 1).to_list(500)
    return str_ids(players)

@app.get("/api/players/{player_id}")
async def get_player(player_id: str, request: Request):
    user = await get_user_from_request(request)
    player = await db.players.find_one({"_id": ObjectId(player_id), "club_id": user["club_id"]})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get team info
    team = None
    if player.get("team_id"):
        team_doc = await db.teams.find_one({"_id": ObjectId(player["team_id"])})
        if team_doc:
            team = str_id(team_doc)
    
    # Get metrics
    metrics = await db.player_metrics.find({"player_id": player_id}).sort("date", -1).to_list(50)
    
    # Get injuries
    injuries = await db.player_injuries.find({"player_id": player_id}).sort("date", -1).to_list(50)
    
    # Get evaluations
    evaluations = await db.player_evaluations.find({"player_id": player_id}).sort("created_at", -1).to_list(50)
    
    # Get match stats
    match_stats = await db.match_player_stats.find({"player_id": player_id}).sort("date", -1).to_list(50)
    
    # Get training attendance
    attendance = await db.training_attendance.find({"player_id": player_id}).to_list(200)
    
    return {
        **str_id(player),
        "team": team,
        "metrics": str_ids(metrics),
        "injuries": str_ids(injuries),
        "evaluations": str_ids(evaluations),
        "match_stats": str_ids(match_stats),
        "attendance": str_ids(attendance)
    }

@app.post("/api/players")
async def create_player(data: PlayerCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {**data.dict(), "club_id": user["club_id"], "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.players.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.put("/api/players/{player_id}")
async def update_player(player_id: str, request: Request):
    user = await get_user_from_request(request)
    body = await request.json()
    body.pop("id", None)
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.players.update_one(
        {"_id": ObjectId(player_id), "club_id": user["club_id"]},
        {"$set": body}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"status": "updated"}

@app.delete("/api/players/{player_id}")
async def delete_player(player_id: str, request: Request):
    user = await get_user_from_request(request)
    result = await db.players.delete_one({"_id": ObjectId(player_id), "club_id": user["club_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"status": "deleted"}

# PLAYER METRICS
@app.post("/api/player-metrics")
async def create_metric(data: PlayerMetricCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {**data.dict(), "club_id": user["club_id"], "created_at": datetime.now(timezone.utc).isoformat()}
    if not doc.get("date"):
        doc["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = await db.player_metrics.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

# PLAYER INJURIES
@app.post("/api/player-injuries")
async def create_injury(data: InjuryCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {**data.dict(), "club_id": user["club_id"], "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.player_injuries.insert_one(doc)
    # Update player status if active injury
    if data.status == "active":
        await db.players.update_one(
            {"_id": ObjectId(data.player_id), "club_id": user["club_id"]},
            {"$set": {"status": "injured"}}
        )
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.put("/api/player-injuries/{injury_id}")
async def update_injury(injury_id: str, request: Request):
    user = await get_user_from_request(request)
    body = await request.json()
    body.pop("id", None)
    body.pop("_id", None)
    await db.player_injuries.update_one(
        {"_id": ObjectId(injury_id), "club_id": user["club_id"]},
        {"$set": body}
    )
    return {"status": "updated"}

# TEAMS
@app.get("/api/teams")
async def get_teams(request: Request):
    user = await get_user_from_request(request)
    teams = await db.teams.find({"club_id": user["club_id"]}).sort("name", 1).to_list(100)
    result = []
    for team in teams:
        t = str_id(team)
        player_count = await db.players.count_documents({"club_id": user["club_id"], "team_id": t["id"]})
        t["player_count"] = player_count
        result.append(t)
    return result

@app.get("/api/teams/{team_id}")
async def get_team(team_id: str, request: Request):
    user = await get_user_from_request(request)
    team = await db.teams.find_one({"_id": ObjectId(team_id), "club_id": user["club_id"]})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    players = await db.players.find({"club_id": user["club_id"], "team_id": team_id}).to_list(100)
    sessions = await db.training_sessions.find({"club_id": user["club_id"], "team_id": team_id}).sort("date", -1).limit(10).to_list(10)
    matches = await db.matches.find({"club_id": user["club_id"], "team_id": team_id}).sort("date", -1).limit(10).to_list(10)
    
    return {
        **str_id(team),
        "players": str_ids(players),
        "training_sessions": str_ids(sessions),
        "matches": str_ids(matches)
    }

@app.post("/api/teams")
async def create_team(data: TeamCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {**data.dict(), "club_id": user["club_id"], "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.teams.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.put("/api/teams/{team_id}")
async def update_team(team_id: str, request: Request):
    user = await get_user_from_request(request)
    body = await request.json()
    body.pop("id", None)
    body.pop("_id", None)
    await db.teams.update_one(
        {"_id": ObjectId(team_id), "club_id": user["club_id"]},
        {"$set": body}
    )
    return {"status": "updated"}

@app.delete("/api/teams/{team_id}")
async def delete_team(team_id: str, request: Request):
    user = await get_user_from_request(request)
    await db.teams.delete_one({"_id": ObjectId(team_id), "club_id": user["club_id"]})
    return {"status": "deleted"}

# TRAINING SESSIONS
@app.get("/api/training")
async def get_training(request: Request, team_id: str = ""):
    user = await get_user_from_request(request)
    query = {"club_id": user["club_id"]}
    if team_id:
        query["team_id"] = team_id
    sessions = await db.training_sessions.find(query).sort("date", -1).to_list(200)
    result = []
    for s in sessions:
        s_data = str_id(s)
        # Get team name
        if s.get("team_id"):
            team = await db.teams.find_one({"_id": ObjectId(s["team_id"])})
            s_data["team_name"] = team.get("name", "") if team else ""
        # Get attendance count
        total = await db.training_attendance.count_documents({"session_id": s_data["id"]})
        present = await db.training_attendance.count_documents({"session_id": s_data["id"], "status": "present"})
        s_data["total_attendance"] = total
        s_data["present_count"] = present
        result.append(s_data)
    return result

@app.get("/api/training/{session_id}")
async def get_training_session(session_id: str, request: Request):
    user = await get_user_from_request(request)
    session = await db.training_sessions.find_one({"_id": ObjectId(session_id), "club_id": user["club_id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    attendance = await db.training_attendance.find({"session_id": session_id}).to_list(100)
    # Enrich attendance with player names
    enriched = []
    for a in attendance:
        a_data = str_id(a)
        player = await db.players.find_one({"_id": ObjectId(a["player_id"])})
        if player:
            a_data["player_name"] = f"{player['first_name']} {player['last_name']}"
        enriched.append(a_data)
    
    team = None
    if session.get("team_id"):
        team_doc = await db.teams.find_one({"_id": ObjectId(session["team_id"])})
        if team_doc:
            team = str_id(team_doc)
    
    return {**str_id(session), "attendance": enriched, "team": team}

@app.post("/api/training")
async def create_training(data: TrainingCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {**data.dict(), "club_id": user["club_id"], "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.training_sessions.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.post("/api/training/{session_id}/attendance")
async def save_attendance(session_id: str, request: Request):
    user = await get_user_from_request(request)
    body = await request.json()
    records = body.get("records", [])
    
    # Clear existing
    await db.training_attendance.delete_many({"session_id": session_id})
    
    for r in records:
        await db.training_attendance.insert_one({
            "session_id": session_id,
            "player_id": r["player_id"],
            "status": r.get("status", "present"),
            "club_id": user["club_id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return {"status": "saved", "count": len(records)}

# MATCHES
@app.get("/api/matches")
async def get_matches(request: Request, team_id: str = "", status: str = ""):
    user = await get_user_from_request(request)
    query = {"club_id": user["club_id"]}
    if team_id:
        query["team_id"] = team_id
    if status:
        query["status"] = status
    matches = await db.matches.find(query).sort("date", -1).to_list(200)
    result = []
    for m in matches:
        m_data = str_id(m)
        if m.get("team_id"):
            team = await db.teams.find_one({"_id": ObjectId(m["team_id"])})
            m_data["team_name"] = team.get("name", "") if team else ""
        result.append(m_data)
    return result

@app.get("/api/matches/{match_id}")
async def get_match(match_id: str, request: Request):
    user = await get_user_from_request(request)
    match = await db.matches.find_one({"_id": ObjectId(match_id), "club_id": user["club_id"]})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    stats = await db.match_player_stats.find({"match_id": match_id}).to_list(50)
    enriched_stats = []
    for s in stats:
        s_data = str_id(s)
        player = await db.players.find_one({"_id": ObjectId(s["player_id"])})
        if player:
            s_data["player_name"] = f"{player['first_name']} {player['last_name']}"
            s_data["position"] = player.get("position", "")
        enriched_stats.append(s_data)
    
    team = None
    if match.get("team_id"):
        team_doc = await db.teams.find_one({"_id": ObjectId(match["team_id"])})
        if team_doc:
            team = str_id(team_doc)
    
    return {**str_id(match), "player_stats": enriched_stats, "team": team}

@app.post("/api/matches")
async def create_match(data: MatchCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {**data.dict(), "club_id": user["club_id"], "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.matches.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.put("/api/matches/{match_id}")
async def update_match(match_id: str, request: Request):
    user = await get_user_from_request(request)
    body = await request.json()
    body.pop("id", None)
    body.pop("_id", None)
    await db.matches.update_one(
        {"_id": ObjectId(match_id), "club_id": user["club_id"]},
        {"$set": body}
    )
    return {"status": "updated"}

# CALENDAR
@app.get("/api/calendar")
async def get_calendar(request: Request, team_id: str = ""):
    user = await get_user_from_request(request)
    cid = user["club_id"]
    events = []
    
    # Training sessions
    tq = {"club_id": cid}
    if team_id:
        tq["team_id"] = team_id
    training = await db.training_sessions.find(tq).to_list(500)
    for t in training:
        events.append({
            "id": str(t["_id"]),
            "title": t.get("title", "Training"),
            "start": f"{t['date']}T{t.get('start_time', '09:00')}",
            "end": f"{t['date']}T{t.get('end_time', '10:00')}",
            "type": "training",
            "color": "#22c55e"
        })
    
    # Matches
    mq = {"club_id": cid}
    if team_id:
        mq["team_id"] = team_id
    matches = await db.matches.find(mq).to_list(500)
    for m in matches:
        events.append({
            "id": str(m["_id"]),
            "title": f"vs {m.get('opponent', 'TBD')}",
            "start": f"{m['date']}T{m.get('time', '15:00')}",
            "type": "match",
            "color": "#3b82f6"
        })
    
    # Custom events
    eq = {"club_id": cid}
    if team_id:
        eq["team_id"] = team_id
    custom = await db.calendar_events.find(eq).to_list(500)
    for e in custom:
        events.append({
            "id": str(e["_id"]),
            "title": e.get("title", "Event"),
            "start": f"{e['date']}T{e.get('start_time', '09:00')}" if e.get("start_time") else e["date"],
            "end": f"{e['date']}T{e.get('end_time', '10:00')}" if e.get("end_time") else None,
            "type": e.get("type", "event"),
            "color": "#f59e0b"
        })
    
    return events

@app.post("/api/calendar")
async def create_calendar_event(data: CalendarEventCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {**data.dict(), "club_id": user["club_id"], "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.calendar_events.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

# SCOUTING / EVALUATIONS
@app.get("/api/scouting")
async def get_evaluations(request: Request, player_id: str = ""):
    user = await get_user_from_request(request)
    query = {"club_id": user["club_id"]}
    if player_id:
        query["player_id"] = player_id
    evals = await db.player_evaluations.find(query).sort("created_at", -1).to_list(200)
    result = []
    for e in evals:
        e_data = str_id(e)
        player = await db.players.find_one({"_id": ObjectId(e["player_id"])})
        if player:
            e_data["player_name"] = f"{player['first_name']} {player['last_name']}"
            e_data["position"] = player.get("position", "")
            e_data["category"] = player.get("category", "")
        result.append(e_data)
    return result

@app.post("/api/scouting")
async def create_evaluation(data: EvaluationCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {
        **data.dict(),
        "club_id": user["club_id"],
        "evaluator_name": data.evaluator_name or user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.player_evaluations.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

# ANNOUNCEMENTS
@app.get("/api/announcements")
async def get_announcements(request: Request):
    user = await get_user_from_request(request)
    anns = await db.announcements.find({"club_id": user["club_id"]}).sort("created_at", -1).to_list(100)
    return str_ids(anns)

@app.post("/api/announcements")
async def create_announcement(data: AnnouncementCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {
        **data.dict(),
        "club_id": user["club_id"],
        "author_name": user["name"],
        "author_role": user["role"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.announcements.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.delete("/api/announcements/{ann_id}")
async def delete_announcement(ann_id: str, request: Request):
    user = await get_user_from_request(request)
    await db.announcements.delete_one({"_id": ObjectId(ann_id), "club_id": user["club_id"]})
    return {"status": "deleted"}

# PARENT PORTAL
@app.get("/api/parent/players")
async def get_parent_players(request: Request):
    user = await get_user_from_request(request)
    if user["role"] != "parent":
        # For demo, return all players
        pass
    players = await db.players.find({"club_id": user["club_id"], "parent_email": user["email"]}).to_list(10)
    if not players:
        players = await db.players.find({"club_id": user["club_id"]}).limit(3).to_list(3)
    return str_ids(players)

@app.get("/api/parent/schedule")
async def get_parent_schedule(request: Request):
    user = await get_user_from_request(request)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sessions = await db.training_sessions.find(
        {"club_id": user["club_id"], "date": {"$gte": today}}
    ).sort("date", 1).limit(20).to_list(20)
    matches = await db.matches.find(
        {"club_id": user["club_id"], "date": {"$gte": today}}
    ).sort("date", 1).limit(20).to_list(20)
    return {"training": str_ids(sessions), "matches": str_ids(matches)}

@app.get("/api/parent/announcements")
async def get_parent_announcements(request: Request):
    user = await get_user_from_request(request)
    anns = await db.announcements.find(
        {"club_id": user["club_id"], "target": {"$in": ["all", "parents"]}}
    ).sort("created_at", -1).limit(20).to_list(20)
    return str_ids(anns)

# ADMIN
@app.get("/api/admin/users")
async def get_users(request: Request):
    user = await get_user_from_request(request)
    users = await db.users.find(
        {"club_id": user["club_id"]}, {"password": 0}
    ).to_list(100)
    return str_ids(users)

@app.put("/api/admin/users/{user_id}")
async def update_user(user_id: str, data: UserUpdate, request: Request):
    user = await get_user_from_request(request)
    update = {}
    if data.name:
        update["name"] = data.name
    if data.role:
        update["role"] = data.role
    if data.status:
        update["status"] = data.status
    if update:
        await db.users.update_one(
            {"_id": ObjectId(user_id), "club_id": user["club_id"]},
            {"$set": update}
        )
    return {"status": "updated"}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    user = await get_user_from_request(request)
    if user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await db.users.delete_one({"_id": ObjectId(user_id), "club_id": user["club_id"]})
    return {"status": "deleted"}

# SETTINGS
@app.get("/api/settings")
async def get_settings(request: Request):
    user = await get_user_from_request(request)
    club = await db.clubs.find_one({"_id": ObjectId(user["club_id"])})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return str_id(club)

@app.put("/api/settings")
async def update_settings(data: ClubSettingsUpdate, request: Request):
    user = await get_user_from_request(request)
    update = {k: v for k, v in data.dict().items() if v is not None}
    if update:
        await db.clubs.update_one(
            {"_id": ObjectId(user["club_id"])},
            {"$set": update}
        )
    return {"status": "updated"}

# SEASONS
@app.post("/api/seasons")
async def create_season(data: SeasonCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {
        "name": data.name,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "description": data.description or "",
        "status": data.status,
        "club_id": user["club_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.seasons.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.get("/api/seasons")
async def get_seasons(request: Request):
    user = await get_user_from_request(request)
    seasons = await db.seasons.find({"club_id": user["club_id"]}).sort("start_date", -1).to_list(100)
    result = []
    for s in seasons:
        s_data = str_id(s)
        # Attach stats: matches and training count within season date range
        match_count = await db.matches.count_documents({
            "club_id": user["club_id"],
            "date": {"$gte": s_data["start_date"], "$lte": s_data["end_date"]}
        })
        training_count = await db.training_sessions.count_documents({
            "club_id": user["club_id"],
            "date": {"$gte": s_data["start_date"], "$lte": s_data["end_date"]}
        })
        matches_in_range = await db.matches.find({
            "club_id": user["club_id"],
            "date": {"$gte": s_data["start_date"], "$lte": s_data["end_date"]},
            "status": "completed"
        }).to_list(500)
        wins = sum(1 for m in matches_in_range if (m.get("home_score") or 0) > (m.get("away_score") or 0))
        losses = sum(1 for m in matches_in_range if (m.get("home_score") or 0) < (m.get("away_score") or 0))
        draws = sum(1 for m in matches_in_range if (m.get("home_score") or 0) == (m.get("away_score") or 0))
        s_data["stats"] = {
            "matches": match_count,
            "training_sessions": training_count,
            "wins": wins, "losses": losses, "draws": draws,
            "completed_matches": len(matches_in_range)
        }
        result.append(s_data)
    return result

@app.get("/api/seasons/{season_id}")
async def get_season(season_id: str, request: Request):
    user = await get_user_from_request(request)
    season = await db.seasons.find_one({"_id": ObjectId(season_id), "club_id": user["club_id"]})
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    s_data = str_id(season)
    # Matches in this season
    matches = await db.matches.find({
        "club_id": user["club_id"],
        "date": {"$gte": s_data["start_date"], "$lte": s_data["end_date"]}
    }).sort("date", 1).to_list(200)
    s_data["matches"] = str_ids(matches)
    # Training sessions in this season
    training = await db.training_sessions.find({
        "club_id": user["club_id"],
        "date": {"$gte": s_data["start_date"], "$lte": s_data["end_date"]}
    }).sort("date", 1).to_list(200)
    s_data["training_sessions"] = str_ids(training)
    # Stats
    completed = [m for m in matches if m.get("status") == "completed"]
    wins = sum(1 for m in completed if (m.get("home_score") or 0) > (m.get("away_score") or 0))
    losses = sum(1 for m in completed if (m.get("home_score") or 0) < (m.get("away_score") or 0))
    draws = sum(1 for m in completed if (m.get("home_score") or 0) == (m.get("away_score") or 0))
    goals_for = sum(m.get("home_score") or 0 for m in completed)
    goals_against = sum(m.get("away_score") or 0 for m in completed)
    s_data["stats"] = {
        "total_matches": len(matches), "completed_matches": len(completed),
        "total_training": len(training),
        "wins": wins, "losses": losses, "draws": draws,
        "goals_for": goals_for, "goals_against": goals_against
    }
    # Teams info
    teams = await db.teams.find({"club_id": user["club_id"]}, {"_id": 1, "name": 1, "category": 1, "color": 1}).to_list(50)
    s_data["teams"] = str_ids(teams)
    return s_data

@app.put("/api/seasons/{season_id}")
async def update_season(season_id: str, data: SeasonUpdate, request: Request):
    user = await get_user_from_request(request)
    update = {k: v for k, v in data.dict().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    # If setting to active, deactivate other seasons
    if update.get("status") == "active":
        await db.seasons.update_many(
            {"club_id": user["club_id"], "status": "active"},
            {"$set": {"status": "completed"}}
        )
    await db.seasons.update_one(
        {"_id": ObjectId(season_id), "club_id": user["club_id"]},
        {"$set": update}
    )
    updated = await db.seasons.find_one({"_id": ObjectId(season_id)})
    return str_id(updated)

@app.delete("/api/seasons/{season_id}")
async def delete_season(season_id: str, request: Request):
    user = await get_user_from_request(request)
    result = await db.seasons.delete_one({"_id": ObjectId(season_id), "club_id": user["club_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Season not found")
    return {"status": "deleted"}

@app.get("/api/seasons/{season_id}/leaderboard")
async def get_season_leaderboard(season_id: str, request: Request):
    user = await get_user_from_request(request)
    season = await db.seasons.find_one({"_id": ObjectId(season_id), "club_id": user["club_id"]})
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    
    start = season["start_date"]
    end = season["end_date"]
    club_id = user["club_id"]
    
    # Get completed matches in this season
    matches = await db.matches.find({
        "club_id": club_id, "status": "completed",
        "date": {"$gte": start, "$lte": end}
    }).to_list(500)
    match_ids = [str(m["_id"]) for m in matches]
    
    # Get all player stats for these matches
    all_stats = await db.match_player_stats.find({
        "match_id": {"$in": match_ids}, "club_id": club_id
    }).to_list(5000)
    
    # Aggregate goals and assists per player
    player_goals = {}
    player_assists = {}
    player_matches_count = {}
    player_ratings = {}
    for s in all_stats:
        pid = s["player_id"]
        player_goals[pid] = player_goals.get(pid, 0) + (s.get("goals") or 0)
        player_assists[pid] = player_assists.get(pid, 0) + (s.get("assists") or 0)
        player_matches_count[pid] = player_matches_count.get(pid, 0) + 1
        if pid not in player_ratings:
            player_ratings[pid] = []
        if s.get("rating"):
            player_ratings[pid].append(s["rating"])
    
    # Get training sessions in this season
    sessions = await db.training_sessions.find({
        "club_id": club_id,
        "date": {"$gte": start, "$lte": end}
    }).to_list(500)
    session_ids = [str(s["_id"]) for s in sessions]
    
    # Get attendance records
    attendance = await db.training_attendance.find({
        "session_id": {"$in": session_ids}, "club_id": club_id
    }).to_list(10000)
    
    player_attendance = {}
    for a in attendance:
        pid = a["player_id"]
        if pid not in player_attendance:
            player_attendance[pid] = {"total": 0, "present": 0}
        player_attendance[pid]["total"] += 1
        if a.get("status") == "present":
            player_attendance[pid]["present"] += 1
    
    # Get all relevant player IDs
    all_pids = set(list(player_goals.keys()) + list(player_attendance.keys()))
    
    # Fetch player info
    player_info = {}
    for pid in all_pids:
        try:
            p = await db.players.find_one({"_id": ObjectId(pid)}, {
                "first_name": 1, "last_name": 1, "jersey_number": 1,
                "category": 1, "team_id": 1, "photo_url": 1, "position": 1
            })
            if p:
                player_info[pid] = {
                    "id": pid,
                    "first_name": p.get("first_name", ""),
                    "last_name": p.get("last_name", ""),
                    "jersey_number": p.get("jersey_number"),
                    "category": p.get("category", ""),
                    "team_id": p.get("team_id", ""),
                    "photo_url": p.get("photo_url", ""),
                    "position": p.get("position", "")
                }
        except Exception:
            pass
    
    # Get team names
    teams = await db.teams.find({"club_id": club_id}, {"name": 1}).to_list(50)
    team_names = {str(t["_id"]): t["name"] for t in teams}
    
    def build_entry(pid, stat_value, stat_key):
        info = player_info.get(pid, {})
        entry = {**info, stat_key: stat_value}
        entry["team_name"] = team_names.get(info.get("team_id", ""), "")
        entry["matches_played"] = player_matches_count.get(pid, 0)
        ratings = player_ratings.get(pid, [])
        entry["avg_rating"] = round(sum(ratings) / len(ratings), 1) if ratings else 0
        return entry
    
    # Top scorers
    top_scorers = sorted(
        [build_entry(pid, g, "goals") for pid, g in player_goals.items() if g > 0],
        key=lambda x: (-x["goals"], -x.get("avg_rating", 0))
    )[:20]
    
    # Top assists
    top_assists = sorted(
        [build_entry(pid, a, "assists") for pid, a in player_assists.items() if a > 0],
        key=lambda x: (-x["assists"], -x.get("avg_rating", 0))
    )[:20]
    
    # Best attendance
    best_attendance = []
    for pid, att in player_attendance.items():
        if att["total"] > 0:
            rate = round((att["present"] / att["total"]) * 100)
            info = player_info.get(pid, {})
            entry = {**info, "attendance_rate": rate, "sessions_present": att["present"], "sessions_total": att["total"]}
            entry["team_name"] = team_names.get(info.get("team_id", ""), "")
            best_attendance.append(entry)
    best_attendance.sort(key=lambda x: (-x["attendance_rate"], -x["sessions_total"]))
    best_attendance = best_attendance[:20]
    
    # Top rated
    top_rated = []
    for pid, ratings in player_ratings.items():
        if ratings:
            info = player_info.get(pid, {})
            entry = {**info, "avg_rating": round(sum(ratings) / len(ratings), 1), "matches_played": player_matches_count.get(pid, 0)}
            entry["team_name"] = team_names.get(info.get("team_id", ""), "")
            top_rated.append(entry)
    top_rated.sort(key=lambda x: (-x["avg_rating"], -x["matches_played"]))
    top_rated = top_rated[:20]
    
    return {
        "top_scorers": top_scorers,
        "top_assists": top_assists,
        "best_attendance": best_attendance,
        "top_rated": top_rated,
        "season_name": season["name"],
        "total_matches": len(match_ids),
        "total_training": len(session_ids)
    }

# FILE UPLOAD
@app.post("/api/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = await get_user_from_request(request)
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    allowed = {"jpg", "jpeg", "png", "gif", "webp"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed. Use: {', '.join(allowed)}")
    
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{user['club_id']}/{file_id}.{ext}"
    content_type = file.content_type or f"image/{ext}"
    
    result = put_object(path, data, content_type)
    
    doc = {
        "file_id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "club_id": user["club_id"],
        "uploaded_by": user["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(doc)
    
    return {"file_id": file_id, "storage_path": result["path"], "url": f"/api/files/{result['path']}"}

@app.get("/api/files/{path:path}")
async def download_file(path: str, request: Request, auth: str = Query(None)):
    # Support both header and query param auth
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer ") and auth:
        auth_header = f"Bearer {auth}"
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth")
    
    token = auth_header.split(" ")[1]
    decode_token(token)
    
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    data, ct = get_object(path)
    return Response(content=data, media_type=record.get("content_type", ct))

# USER LANGUAGE PREFERENCE
@app.put("/api/user/language")
async def update_user_language(data: LanguageUpdate, request: Request):
    user = await get_user_from_request(request)
    await db.users.update_one(
        {"_id": ObjectId(user["user_id"])},
        {"$set": {"language": data.language}}
    )
    return {"status": "updated", "language": data.language}

@app.get("/api/user/language")
async def get_user_language(request: Request):
    user = await get_user_from_request(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["user_id"])}, {"language": 1})
    return {"language": user_doc.get("language", "en") if user_doc else "en"}

# NOTIFICATIONS (Mock Parent Notification System)
@app.post("/api/notifications")
async def create_notification(data: NotificationCreate, request: Request):
    user = await get_user_from_request(request)
    doc = {
        "subject": data.subject,
        "message": data.message,
        "recipient": data.recipient,
        "team_id": data.team_id,
        "club_id": user["club_id"],
        "sender_name": user["name"],
        "sender_role": user["role"],
        "status": "sent",
        "email_simulated": True,
        "read_by": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.notifications.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@app.get("/api/notifications")
async def get_notifications(request: Request):
    user = await get_user_from_request(request)
    query = {"club_id": user["club_id"]}
    notifs = await db.notifications.find(query).sort("created_at", -1).to_list(100)
    result = []
    for n in notifs:
        n_data = str_id(n)
        n_data["is_read"] = user["user_id"] in n.get("read_by", [])
        result.append(n_data)
    return result

@app.put("/api/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, request: Request):
    user = await get_user_from_request(request)
    await db.notifications.update_one(
        {"_id": ObjectId(notif_id), "club_id": user["club_id"]},
        {"$addToSet": {"read_by": user["user_id"]}}
    )
    return {"status": "read"}

@app.put("/api/notifications/read-all")
async def mark_all_notifications_read(request: Request):
    user = await get_user_from_request(request)
    await db.notifications.update_many(
        {"club_id": user["club_id"]},
        {"$addToSet": {"read_by": user["user_id"]}}
    )
    return {"status": "all_read"}

# SEED DATA
@app.post("/api/seed")
async def seed_data():
    # Check if already seeded
    existing = await db.clubs.count_documents({})
    if existing > 0:
        return {"status": "already_seeded", "message": "Database already has data"}
    
    now = datetime.now(timezone.utc)
    
    # Create club
    club_result = await db.clubs.insert_one({
        "name": "FC Academy Elite",
        "address": "123 Stadium Road, Football City",
        "phone": "+1 555-0100",
        "email": "info@fcacademyelite.com",
        "website": "https://fcacademyelite.com",
        "founded_year": 2015,
        "logo_url": "",
        "created_at": now.isoformat()
    })
    club_id = str(club_result.inserted_id)
    
    # Create admin user
    admin_result = await db.users.insert_one({
        "name": "John Director",
        "email": "admin@academy.com",
        "password": hash_password("admin123"),
        "role": "admin",
        "club_id": club_id,
        "status": "active",
        "created_at": now.isoformat()
    })
    
    # Create coaches
    coaches = []
    coach_names = [
        ("Carlos", "Martinez", "coach"), ("Sarah", "Thompson", "coach"),
        ("Mike", "Anderson", "coach"), ("Elena", "Rodriguez", "coach")
    ]
    for fn, ln, role in coach_names:
        r = await db.users.insert_one({
            "name": f"{fn} {ln}",
            "email": f"{fn.lower()}@academy.com",
            "password": hash_password("coach123"),
            "role": role,
            "club_id": club_id,
            "status": "active",
            "created_at": now.isoformat()
        })
        coaches.append(str(r.inserted_id))
    
    # Create parent user
    await db.users.insert_one({
        "name": "Maria Parent",
        "email": "parent@academy.com",
        "password": hash_password("parent123"),
        "role": "parent",
        "club_id": club_id,
        "status": "active",
        "created_at": now.isoformat()
    })
    
    # Create teams
    team_data = [
        {"name": "U10 Lions", "category": "U10", "color": "#22c55e"},
        {"name": "U12 Tigers", "category": "U12", "color": "#3b82f6"},
        {"name": "U14 Eagles", "category": "U14", "color": "#f59e0b"},
        {"name": "U16 Wolves", "category": "U16", "color": "#ef4444"},
    ]
    team_ids = []
    for i, td in enumerate(team_data):
        r = await db.teams.insert_one({
            **td, "club_id": club_id,
            "coach_id": coaches[i] if i < len(coaches) else None,
            "description": f"Official {td['name']} squad",
            "created_at": now.isoformat()
        })
        team_ids.append(str(r.inserted_id))
    
    # Create 60 players
    positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"]
    first_names = ["James", "Lucas", "Noah", "Oliver", "Ethan", "Liam", "Mason", "Logan", "Alex", "Daniel",
                   "Gabriel", "Samuel", "David", "Benjamin", "William", "Leo", "Mateo", "Diego", "Pablo", "Marco",
                   "Adrian", "Hugo", "Rafa", "Carlos", "Ivan", "Sergio", "Pedro", "Tomas", "Felipe", "Ricardo",
                   "Bruno", "Max", "Oscar", "Harry", "Jack", "Thomas", "George", "Henry", "Charlie", "Freddie",
                   "Archie", "Arthur", "Edward", "Isaac", "Jacob", "Finn", "Teddy", "Sebastian", "Joseph", "Albert",
                   "Milo", "Alfie", "Tommy", "Rex", "Stanley", "Rupert", "Felix", "Louie", "Jasper", "Austin"]
    last_names = ["Smith", "Garcia", "Martinez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Martin",
                  "Rodriguez", "Lee", "Clark", "Lewis", "Walker", "Hall", "Young", "King", "Wright", "Scott",
                  "Green", "Adams", "Baker", "Hill", "Nelson", "Carter", "Mitchell", "Roberts", "Turner", "Phillips",
                  "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Morris", "Murphy", "Cook", "Morgan",
                  "Bell", "Kelly", "Ward", "Cox", "Rivera", "Cooper", "Reed", "Bailey", "Howard", "Bennett",
                  "Gray", "James", "Watson", "Brooks", "Fox", "Hayes", "Russell", "Sullivan", "Fisher", "Powell"]
    
    player_ids = []
    statuses = ["active"] * 55 + ["injured"] * 5
    random.shuffle(statuses)
    
    for i in range(60):
        team_idx = i % 4
        category = ["U10", "U12", "U14", "U16"][team_idx]
        base_year = [2016, 2014, 2012, 2010][team_idx]
        
        pid = await db.players.insert_one({
            "first_name": first_names[i],
            "last_name": last_names[i],
            "date_of_birth": f"{base_year}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "position": positions[i % 4],
            "team_id": team_ids[team_idx],
            "category": category,
            "jersey_number": (i % 15) + 1,
            "phone": f"+1 555-{1000+i}",
            "email": f"{first_names[i].lower()}.{last_names[i].lower()}@email.com",
            "parent_name": f"Parent of {first_names[i]}",
            "parent_phone": f"+1 555-{2000+i}",
            "parent_email": "parent@academy.com" if i < 3 else f"parent{i}@email.com",
            "status": statuses[i],
            "photo_url": "",
            "notes": "",
            "height": round(random.uniform(130, 180), 1),
            "weight": round(random.uniform(35, 75), 1),
            "preferred_foot": random.choice(["right", "right", "right", "left"]),
            "club_id": club_id,
            "created_at": now.isoformat()
        })
        player_ids.append(str(pid.inserted_id))
    
    # Create injuries for injured players
    injury_types = ["Ankle Sprain", "Knee Strain", "Hamstring Pull", "Shin Splints", "Muscle Fatigue"]
    for i, pid in enumerate(player_ids[:5]):
        if statuses[player_ids.index(pid)] == "injured" if pid in player_ids[:60] else False:
            pass
    injured_indices = [i for i in range(60) if statuses[i] == "injured"]
    for idx in injured_indices:
        await db.player_injuries.insert_one({
            "player_id": player_ids[idx],
            "type": random.choice(injury_types),
            "description": "Sustained during training",
            "date": (now - timedelta(days=random.randint(1, 14))).strftime("%Y-%m-%d"),
            "expected_return": (now + timedelta(days=random.randint(7, 30))).strftime("%Y-%m-%d"),
            "status": "active",
            "club_id": club_id,
            "created_at": now.isoformat()
        })
    
    # Create metrics for some players
    for pid in player_ids[:20]:
        await db.player_metrics.insert_one({
            "player_id": pid,
            "speed": round(random.uniform(5, 10), 1),
            "stamina": round(random.uniform(5, 10), 1),
            "strength": round(random.uniform(4, 9), 1),
            "agility": round(random.uniform(5, 10), 1),
            "technique": round(random.uniform(4, 9), 1),
            "passing": round(random.uniform(5, 10), 1),
            "shooting": round(random.uniform(3, 9), 1),
            "dribbling": round(random.uniform(4, 9), 1),
            "date": now.strftime("%Y-%m-%d"),
            "club_id": club_id,
            "created_at": now.isoformat()
        })
    
    # Create 10 training sessions
    session_ids = []
    for i in range(10):
        team_idx = i % 4
        session_date = (now + timedelta(days=i - 3)).strftime("%Y-%m-%d")
        r = await db.training_sessions.insert_one({
            "title": f"{'Tactical' if i%3==0 else 'Technical' if i%3==1 else 'Physical'} Training - {team_data[team_idx]['name']}",
            "team_id": team_ids[team_idx],
            "date": session_date,
            "start_time": "16:00",
            "end_time": "17:30",
            "location": random.choice(["Main Field", "Training Ground A", "Indoor Facility"]),
            "description": f"Regular training session for {team_data[team_idx]['name']}",
            "type": random.choice(["regular", "tactical", "physical", "technical"]),
            "club_id": club_id,
            "created_at": now.isoformat()
        })
        session_ids.append(str(r.inserted_id))
        
        # Add attendance for past sessions
        if i < 5:
            team_players = [player_ids[j] for j in range(60) if j % 4 == team_idx]
            for pid in team_players:
                await db.training_attendance.insert_one({
                    "session_id": session_ids[-1],
                    "player_id": pid,
                    "status": random.choice(["present", "present", "present", "present", "absent", "late"]),
                    "club_id": club_id,
                    "created_at": now.isoformat()
                })
    
    # Create 6 matches
    opponents = ["FC United", "Real Stars", "City Youth", "Athletic Junior", "Dynamo Kids", "Sporting Academy"]
    for i in range(6):
        team_idx = i % 4
        match_date = (now + timedelta(days=i * 3 - 5)).strftime("%Y-%m-%d")
        is_past = i < 3
        home_score = random.randint(0, 5) if is_past else None
        away_score = random.randint(0, 4) if is_past else None
        
        mr = await db.matches.insert_one({
            "team_id": team_ids[team_idx],
            "opponent": opponents[i],
            "date": match_date,
            "time": "15:00",
            "location": random.choice(["Home Stadium", "Away Field", "Neutral Ground"]),
            "type": random.choice(["league", "cup", "friendly"]),
            "home_score": home_score,
            "away_score": away_score,
            "status": "completed" if is_past else "scheduled",
            "notes": "Good performance" if is_past else "",
            "club_id": club_id,
            "created_at": now.isoformat()
        })
        
        if is_past:
            match_id = str(mr.inserted_id)
            team_players = [player_ids[j] for j in range(60) if j % 4 == team_idx][:11]
            for pid in team_players:
                await db.match_player_stats.insert_one({
                    "match_id": match_id,
                    "player_id": pid,
                    "minutes_played": random.randint(45, 90),
                    "goals": random.randint(0, 2),
                    "assists": random.randint(0, 2),
                    "yellow_cards": random.randint(0, 1),
                    "red_cards": 0,
                    "rating": round(random.uniform(5, 9), 1),
                    "club_id": club_id,
                    "date": match_date,
                    "created_at": now.isoformat()
                })
    
    # Create evaluations
    for i in range(15):
        pid = player_ids[i]
        await db.player_evaluations.insert_one({
            "player_id": pid,
            "evaluator_name": random.choice(["Carlos Martinez", "Sarah Thompson"]),
            "technical": random.randint(4, 9),
            "tactical": random.randint(4, 9),
            "physical": random.randint(4, 9),
            "mental": random.randint(5, 9),
            "overall": random.randint(5, 9),
            "notes": random.choice([
                "Shows excellent potential. Strong technical skills.",
                "Good tactical awareness. Needs to improve stamina.",
                "Natural leader. Great passing ability.",
                "Quick and agile. Should work on shooting accuracy.",
                "Consistent performer. Ready for higher competition."
            ]),
            "recommendation": random.choice(["promote", "monitor", "develop", "star_potential"]),
            "club_id": club_id,
            "created_at": (now - timedelta(days=random.randint(0, 30))).isoformat()
        })
    
    # Create 5 announcements
    announcement_data = [
        {"title": "Welcome to the New Season!", "content": "We're excited to kick off our new season. All teams will begin training next week. Please ensure all registration forms are completed.", "priority": "high"},
        {"title": "Weekend Tournament Update", "content": "The U14 Eagles will participate in the Regional Cup this weekend. Bus departure at 8:00 AM from the main stadium.", "priority": "normal"},
        {"title": "New Training Equipment", "content": "We've received new training equipment including cones, bibs, and agility ladders. Coaches will distribute them during next training session.", "priority": "low"},
        {"title": "Parent Meeting - January 25", "content": "All parents are invited to attend our quarterly meeting on January 25th at 7 PM. We'll discuss season progress and upcoming events.", "priority": "high"},
        {"title": "Holiday Schedule", "content": "Training sessions will be reduced during the holiday period. Please check the calendar for the updated schedule.", "priority": "normal"},
    ]
    for ad in announcement_data:
        await db.announcements.insert_one({
            **ad,
            "target": "all",
            "team_id": None,
            "author_name": "John Director",
            "author_role": "admin",
            "club_id": club_id,
            "created_at": (now - timedelta(days=random.randint(0, 14))).isoformat()
        })
    
    # Add some calendar events
    events = [
        {"title": "Season Opening Ceremony", "type": "event", "date": (now + timedelta(days=7)).strftime("%Y-%m-%d"), "start_time": "10:00", "end_time": "12:00"},
        {"title": "Coach Workshop", "type": "event", "date": (now + timedelta(days=14)).strftime("%Y-%m-%d"), "start_time": "09:00", "end_time": "16:00"},
        {"title": "Regional Tournament", "type": "tournament", "date": (now + timedelta(days=21)).strftime("%Y-%m-%d"), "start_time": "08:00", "end_time": "18:00"},
    ]
    for ev in events:
        await db.calendar_events.insert_one({
            **ev, "club_id": club_id, "team_id": None,
            "description": f"{ev['title']} event",
            "created_at": now.isoformat()
        })
    
    # Create seasons
    await db.seasons.insert_one({
        "name": "2024-2025 Season",
        "start_date": "2024-09-01",
        "end_date": "2025-06-30",
        "description": "Previous season - foundation year for all teams. Strong development across U10-U16 squads.",
        "status": "completed",
        "club_id": club_id,
        "created_at": (now - timedelta(days=180)).isoformat()
    })
    await db.seasons.insert_one({
        "name": "2025-2026 Season",
        "start_date": "2025-09-01",
        "end_date": "2026-06-30",
        "description": "Current active season. Focus on competitive play and player development pathways.",
        "status": "active",
        "club_id": club_id,
        "created_at": (now - timedelta(days=30)).isoformat()
    })
    await db.seasons.insert_one({
        "name": "Summer Camp 2026",
        "start_date": "2026-07-01",
        "end_date": "2026-08-31",
        "description": "Intensive summer training camp with guest coaches and friendly tournaments.",
        "status": "upcoming",
        "club_id": club_id,
        "created_at": now.isoformat()
    })
    
    return {
        "status": "seeded",
        "data": {
            "club": "FC Academy Elite",
            "teams": 4,
            "players": 60,
            "training_sessions": 10,
            "matches": 6,
            "announcements": 5,
            "seasons": 3,
            "credentials": {
                "admin": {"email": "admin@academy.com", "password": "admin123"},
                "coach": {"email": "carlos@academy.com", "password": "coach123"},
                "parent": {"email": "parent@academy.com", "password": "parent123"}
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
