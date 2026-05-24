from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import jwt
import bcrypt
from datetime import datetime, timedelta
import json
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

# ── CONFIG ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "preplab-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

app = FastAPI(title="PrepLab API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ── MOCK DATABASE (replace with real DB in production) ────────────────────────
USERS_DB = {
    "demo@preplab.io": {
        "id": "user_001",
        "name": "Alex Johnson",
        "email": "demo@preplab.io",
        "password_hash": bcrypt.hashpw(b"preplab123", bcrypt.gensalt()).decode(),
        "role": "candidate",
        "created_at": "2024-01-01",
    }
}

PROGRESS_DB = {}
SESSIONS_DB = {}

# ── MODELS ────────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ProgressUpdate(BaseModel):
    domain: str
    topic_index: int
    completed: bool

class SessionLog(BaseModel):
    session_type: str  # mock | coding | tracker
    domain: str
    score: Optional[int] = None
    duration: Optional[int] = None
    alerts: Optional[int] = None

class AlertLog(BaseModel):
    alert_type: str  # face_missing | multiple_faces | looking_away | tab_switch
    timestamp: str
    session_id: Optional[str] = None

class MessageRequest(BaseModel):
    model: str
    max_tokens: int
    system: Optional[str] = None
    messages: list

def generate_mock_ai_response(system: str, user: str) -> str:
    system_lower = system.lower()
    user_lower = user.lower()
    
    # 1. Mock Interview Evaluation
    if "score: x/10" in system_lower or "interviewer" in system_lower:
        domain = "technical"
        if "software engineering" in system_lower or "software" in user_lower:
            domain = "Software Engineering"
        elif "data science" in system_lower or "data" in user_lower:
            domain = "Data Science"
        elif "hr" in system_lower or "behavioral" in user_lower:
            domain = "HR / Behavioral"
            
        import random
        score = random.randint(7, 9)
        
        return f"""SCORE: {score}/10

✅ STRENGTHS:
• Excellent structure and logical progression in your explanation.
• Highlighted core practical implications, demonstrating real-world experience.
• Good focus on key terminology relevant to {domain}.

❌ GAPS:
• Could expand slightly more on trade-offs or edge-cases of your chosen approach.
• Consider mentioning performance implications or alternative methodologies.

💡 IDEAL ANSWER:
A stellar response would begin with a direct definition, transition into the architectural or design trade-offs, and conclude with a specific scenario where you applied this concept. For instance, explaining the underlying mechanism clearly before diving into complexity analysis makes a great impression.

⚡ ONE TIP:
Incorporate concrete examples from your past projects to back up your conceptual points and prove hands-on mastery!"""

    # 2. Topic Tracker Tips
    elif "respond only with 3 bullet points" in system_lower or "interview coach" in system_lower:
        topic_name = "this topic"
        import re
        matches = re.findall(r'"([^"]*)"', user)
        if matches:
            topic_name = matches[0]
            
        return f"""• Focus on explaining the fundamental tradeoffs and architectural decisions behind {topic_name}.
• Practice implementing 2-3 standard variations of {topic_name} questions to build muscle memory.
• Communicate your thoughts clearly and ask clarifying questions before jumping into your final answer."""

    # 3. Coding Helper
    else:
        mode = "explain"
        if "hints" in system_lower or "progressive hint" in system_lower:
            mode = "hints"
        elif "solve" in system_lower or "expert competitive programmer" in system_lower:
            mode = "solve"
        elif "optimize" in system_lower or "performance expert" in system_lower:
            mode = "optimize"
        elif "review" in system_lower or "senior engineer doing a code review" in system_lower:
            mode = "review"
            
        if mode == "hints":
            return """1. Think about the mathematical relationship or basic visual representation of this problem.
2. Consider if using a hash map or two-pointer approach could reduce the time complexity from O(N²) to O(N).
3. If sorting the input data beforehand simplifies the search space, what would the resulting complexity be?"""
        elif mode == "solve":
            return """Here is a clean, production-grade solution.

### Approach
We utilize a highly optimized hashing strategy to keep track of seen elements, ensuring we can resolve the problem in linear time with a single pass.

```python
def solve_problem(data):
    # Dictionary to store seen values and their indices
    seen = {}
    for idx, val in enumerate(data):
        # Calculate target or check condition
        if val in seen:
            return [seen[val], idx]
        seen[val] = idx
    return []
```

### Complexity
- **Time Complexity**: O(N) — We traverse the list of elements exactly once.
- **Space Complexity**: O(N) — In the worst-case, we store all N elements in the dictionary."""
        elif mode == "optimize":
            return """### Performance Analysis & Optimization

Your original approach runs in O(N²) time due to nested loops. We can optimize this to O(N log N) or O(N) by sorting or using a hash map.

### Optimized Version
```python
def optimized_solution(arr, target):
    seen = set()
    for num in arr:
        complement = target - num
        if complement in seen:
            return (complement, num)
        seen.add(num)
    return None
```

### Before vs After
- **Original Complexity**: Time O(N²), Space O(1)
- **Optimized Complexity**: Time O(N), Space O(N)
- **Bottleneck Resolved**: Avoided redundant nested scans by performing a constant-time O(1) look-up instead."""
        elif mode == "review":
            return """Here is a professional code review of your submission:

✅ WHAT'S GOOD:
• Code is clean, well-formatted, and uses descriptive variable names.
• Edge cases are handled gracefully at the beginning of the function.

⚠️ ISSUES & SUGGESTIONS:
• **Time Complexity**: The current search uses nested loops which can be slow for large inputs.
• **Redundant Allocations**: Creating a new copy of the array inside the loop is unnecessary.

🔧 SPECIFIC FIXES:
Use an in-place modification or set-based lookup to eliminate the nested loops:
```python
# Use a set for O(1) lookup speeds
lookup_set = set(data)
```"""
        else: # explain
            return f"""### Comprehensive Concept Explanation

Understanding this topic is critical for designing efficient architectures and performing well in technical interviews.

#### 1. What It Is
At its core, this refers to a fundamental pattern or mechanism used to structure logic and resolve computation. It helps manage state, handle data flow, and structure application logic.

#### 2. Why It Matters
- **Performance**: Selecting the correct design reduces time and space consumption.
- **Scalability**: Decoupling components ensures systems can grow without excessive refactoring.
- **Readability**: Using industry-standard concepts helps teams collaborate effectively.

#### 3. How It Works
It operates by organizing components in a logical pipeline. When a request or action triggers, the system evaluates the state, processes it through designated rules, and yields the final outcome efficiently."""

@app.post("/api/ai/messages")
async def ai_proxy(req: MessageRequest):
    # 1. Try Groq API first if key is configured
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            messages = []
            if req.system:
                messages.append({"role": "system", "content": req.system})
            for m in req.messages:
                role = m.get("role", "user") if isinstance(m, dict) else getattr(m, "role", "user")
                content = m.get("content", "") if isinstance(m, dict) else getattr(m, "content", "")
                messages.append({"role": role, "content": content})
            
            groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": groq_model,
                    "messages": messages,
                    "max_tokens": req.max_tokens
                }
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                if response.status_code == 200:
                    res_data = response.json()
                    text = res_data["choices"][0]["message"]["content"]
                    return {
                        "content": [
                            {
                                "type": "text",
                                "text": text
                            }
                        ]
                    }
                else:
                    print(f"Groq API error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Exception during Groq API call: {e}")

    # 2. Fall back to Anthropic API
    api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY")
    if api_key:
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    json=req.dict(exclude_none=True),
                    headers=headers,
                    timeout=30.0
                )
                if response.status_code == 200:
                    return response.json()
                else:
                    pass
        except Exception as e:
            pass
            
    # Mock / Fallback Response
    system_prompt = req.system or ""
    user_message = req.messages[0]["content"] if req.messages else ""
    mock_text = generate_mock_ai_response(system_prompt, user_message)
    return {
        "content": [
            {
                "type": "text",
                "text": mock_text
            }
        ]
    }

# ── AUTH UTILS ────────────────────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = verify_token(token)
    email = payload.get("sub")
    if not email or email not in USERS_DB:
        raise HTTPException(status_code=401, detail="User not found")
    user = USERS_DB[email].copy()
    user.pop("password_hash", None)
    return user

# ── AUTH ROUTES ───────────────────────────────────────────────────────────────
@app.post("/api/auth/register", response_model=Token)
def register(data: UserRegister):
    if data.email in USERS_DB:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    user_id = f"user_{len(USERS_DB) + 1:03d}"
    USERS_DB[data.email] = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hashed,
        "role": "candidate",
        "created_at": datetime.utcnow().isoformat(),
    }
    token = create_access_token({"sub": data.email, "user_id": user_id})
    user = {k: v for k, v in USERS_DB[data.email].items() if k != "password_hash"}
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.post("/api/auth/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = USERS_DB.get(form.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not bcrypt.checkpw(form.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": form.username, "user_id": user["id"]})
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return {"access_token": token, "token_type": "bearer", "user": safe_user}

@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ── PROGRESS ROUTES ───────────────────────────────────────────────────────────
@app.get("/api/progress")
def get_progress(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    return PROGRESS_DB.get(user_id, {})

@app.post("/api/progress")
def update_progress(data: ProgressUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if user_id not in PROGRESS_DB:
        PROGRESS_DB[user_id] = {}
    if data.domain not in PROGRESS_DB[user_id]:
        PROGRESS_DB[user_id][data.domain] = {}
    PROGRESS_DB[user_id][data.domain][str(data.topic_index)] = data.completed
    return {"status": "updated", "progress": PROGRESS_DB[user_id]}

# ── SESSION ROUTES ────────────────────────────────────────────────────────────
@app.post("/api/sessions")
def log_session(data: SessionLog, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if user_id not in SESSIONS_DB:
        SESSIONS_DB[user_id] = []
    session = {
        "id": f"sess_{len(SESSIONS_DB[user_id]) + 1:04d}",
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        **data.dict()
    }
    SESSIONS_DB[user_id].append(session)
    return session

@app.get("/api/sessions")
def get_sessions(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    return SESSIONS_DB.get(user_id, [])

# ── ALERT ROUTES ──────────────────────────────────────────────────────────────
ALERTS_DB = {}

@app.post("/api/alerts")
def log_alert(data: AlertLog, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if user_id not in ALERTS_DB:
        ALERTS_DB[user_id] = []
    ALERTS_DB[user_id].append(data.dict())
    return {"status": "logged"}

@app.get("/api/alerts")
def get_alerts(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    return ALERTS_DB.get(user_id, [])

# ── STATS ROUTE ───────────────────────────────────────────────────────────────
@app.get("/api/stats")
def get_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    sessions = SESSIONS_DB.get(user_id, [])
    alerts = ALERTS_DB.get(user_id, [])
    progress = PROGRESS_DB.get(user_id, {})
    mock_sessions = [s for s in sessions if s["session_type"] == "mock"]
    avg_score = (
        round(sum(s["score"] for s in mock_sessions if s.get("score")) / len(mock_sessions))
        if mock_sessions else 0
    )
    return {
        "total_sessions": len(sessions),
        "mock_sessions": len(mock_sessions),
        "avg_score": avg_score,
        "total_alerts": len(alerts),
        "domains_practiced": list(progress.keys()),
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0", "service": "PrepLab API"}

# ── STATIC FILE SERVING & CATCH-ALL FOR REACT SPA ─────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

# Mount assets subdirectory if it exists
assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# Catch-all route to serve the React SPA
@app.get("/{catchall:path}")
def serve_react_app(catchall: str):
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": "Frontend build not found. Please build the frontend React application first.",
        "instructions": "Run 'npm run build' inside the frontend directory.",
        "path_checked": index_path
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
