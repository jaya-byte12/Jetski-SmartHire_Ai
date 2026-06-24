# SmartHire AI - Resume Intelligence & Career Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![GCP Cloud Run](https://img.shields.io/badge/GCP_Cloud_Run-Compatible-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/run)

SmartHire AI is a state-of-the-art, full-stack recruitment intelligence platform designed to streamline talent sourcing, evaluate resume keyword compatibility, run async bulk screenings, and construct 6-month career roadmaps for candidates. It is engineered with a modular Python FastAPI backend and a responsive, glassmorphic React (TypeScript) frontend.

---

## 🏗️ Architecture Design (Text-Based Diagram)

```text
                               +-----------------------------+
                               |      React Frontend         |
                               | (TypeScript + Tailwind CSS) |
                               +--------------+--------------+
                                              |
                                              | HTTPS REST API
                                              v
                               +--------------+--------------+
                               |     FastAPI Backend         |
                               | (Python API + Token Limiter)|
                               +-------+-------+------+------+
                                       |       |      |
                    Upload Resume      |       |      | Gemini Pro API
                 +---------------------+       |      +---------------------+
                 |                             |                            |
                 v                             v                            v
      +----------+----------+       +----------+----------+      +----------+----------+
      | Google Cloud Storage|       |  Google Firestore   |      | Google Gemini API   |
      |   (PDF/DOCX Blob)   |       | (Screening History) |      |   (gemini-1.5-pro)  |
      +---------------------+       +---------------------+      +---------------------+
```

---

## 🛠️ Tech Stack Features

- **Asynchronous Processing**: Python `asyncio` handles bulk screening concurrently, enabling rapid evaluation of multiple candidates without blocking.
- **Robust Parsing**: Integrates PyPDF2 and python-docx for resume text extraction.
- **Resilient Fallback Mode**: If GCP or Gemini credentials are missing, the services fall back to local disk storage, local JSON DB, and dynamic keyword-based evaluations, remaining fully testable.
- **Google OAuth**: Integrated Google Authentication via Firebase Auth SDK (with mock recruiter credentials bypass for offline/local evaluation).
- **Security & Efficiency**: Token-bucket rate-limiting middleware restricts endpoint abuse. Strict input validation is enforced via Pydantic.

---

## 🚀 Local Setup Instructions

### 1. Backend Setup (FastAPI)

Ensure you have **Python 3.11+** installed.

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux / macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Create your local environment file
cp ../.env.example .env
```

Edit the `.env` file to provide your actual `GEMINI_API_KEY`, `GOOGLE_CLOUD_PROJECT`, and `CLOUD_STORAGE_BUCKET`. If left blank, the app runs in **Mock Fallback Mode**.

```bash
# Launch development server
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

- **Swagger API Docs**: View auto-generated Swagger documentation at [http://localhost:8080/docs](http://localhost:8080/docs)
- **Health Check**: Test status at [http://localhost:8080/health](http://localhost:8080/health)

### 2. Frontend Setup (React)

Ensure you have **Node.js 18+** installed.

```bash
# Navigate to frontend folder
cd frontend

# Install package dependencies
npm install

# Run Vite local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The frontend proxy will automatically route all `/api/*` traffic to your local backend at `http://localhost:8080`.

---

## 🐳 Docker Deployment

The backend contains a production-ready multi-worker Docker configuration.

```bash
# Build Docker image
docker build -t smarthire-backend ./backend

# Run container locally
docker run -p 8080:8080 --env-file ./backend/.env smarthire-backend
```

---

## 🔗 Live Demo URLs

- **API Swagger documentation endpoint**: `https://smarthire-api-production.up.railway.app/docs` (Placeholder)
- **Hosted Live Demo**: `https://smarthire-ai.web.app` (Placeholder)
