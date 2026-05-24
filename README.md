# ◈ PrepLab v2.0 — Interview Preparation Platform

A full-stack interview prep platform with AI mock interviews, coding helper,
topic tracker, live camera focus monitoring, and JWT authentication.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + React Router v6   |
| Backend   | Python FastAPI + Uvicorn            |
| Auth      | JWT (PyJWT + bcrypt)                |
| AI        | Claude Sonnet API (claude.ai proxy) |
| Camera    | face-api.js (TinyFaceDetector)      |
| Charts    | Recharts                            |

---

## Project Structure

```
preplab/
├── backend/
│   ├── main.py           ← FastAPI app (JWT auth, progress, sessions, alerts)
│   ├── requirements.txt
│   └── start.sh
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx    ← JWT auth context + axios
│   │   ├── hooks/
│   │   │   └── useCameraMonitor.js ← face-api.js camera hook
│   │   ├── components/
│   │   │   └── Layout.jsx         ← Sidebar + camera monitor panel
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── MockInterviewPage.jsx
│   │   │   ├── CodingHelperPage.jsx
│   │   │   └── TrackerPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at:     http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Demo Login

```
Email:    demo@preplab.io
Password: preplab123
```

Or register a new account at /register

---

## Features

### 🔐 JWT Authentication
- Register / Login with bcrypt hashed passwords
- JWT tokens stored in localStorage
- Auto-refresh on 401, redirect to login
- Protected routes via React Router

### ⚡ Dashboard
- Session stats (total, mock count, avg score, alerts)
- Score trend chart (Recharts AreaChart)
- Domain coverage bars
- Recent activity feed

### 🎤 Mock Interview
- 3 domains: Software Engineering, Data Science, HR/Non-Tech
- Easy / Medium / Hard difficulty
- Live answer timer
- Claude AI scores answer 1–10 with structured feedback
- Session history with scores saved to backend

### 💻 Coding Helper
- 5 modes: Explain, Hints, Solve, Optimize, Review
- 8 languages: Python, JS, TS, Java, C++, Go, SQL, Rust
- Side-by-side editor + output layout
- Query history (click to restore)

### 📚 Topic Tracker
- 3 domains with tagged topics + difficulty labels
- Progress synced to backend via JWT API
- Click 💡 for AI study tips per topic
- Personal notes per topic
- Filter by difficulty

### 📷 Focus Monitor (Camera)
- Sidebar camera widget — always visible
- face-api.js TinyFaceDetector (loads from CDN)
- Alerts for: face missing, multiple faces, looking away
- Alerts logged to backend with timestamps
- Graceful fallback if camera unavailable

---

## API Endpoints

| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| POST   | /api/auth/register | No   | Create account           |
| POST   | /api/auth/login    | No   | Get JWT token            |
| GET    | /api/auth/me       | Yes  | Current user info        |
| GET    | /api/progress      | Yes  | Get topic progress       |
| POST   | /api/progress      | Yes  | Update topic progress    |
| GET    | /api/sessions      | Yes  | Get session history      |
| POST   | /api/sessions      | Yes  | Log a session            |
| GET    | /api/alerts        | Yes  | Get camera alerts        |
| POST   | /api/alerts        | Yes  | Log a camera alert       |
| GET    | /api/stats         | Yes  | Aggregated user stats    |
| GET    | /api/health        | No   | Health check             |

---

## Production Notes

1. Change `JWT_SECRET` env variable to a strong random string
2. Replace in-memory dicts in `main.py` with a real database (PostgreSQL + SQLAlchemy)
3. Set CORS origins to your actual domain
4. Use HTTPS in production
5. Store Claude API key securely (backend proxy recommended)

---

Built with ❤️ using React + FastAPI + Claude AI
