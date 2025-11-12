# LinkedIn Content Generation & Analytics Platform

## Overview

This project is a platform designed to help users generate, schedule, and analyze LinkedIn content efficiently.
It combines a Next.js frontend for an interactive UI with a FastAPI backend for data processing, API interactions, and analytics.

## Features (TBU)

- Real-time API communication between frontend and backend

## Tech Stack

- Frontend: Next.js (React, TypeScript, Tailwind CSS)
- Backend: FastAPI (Python)
- Database: TBU
- AI/ML Services: OpenAI API
- Deployment: TBU

## Folder Structure

qtma25/
backend/
main.py
requirements.txt
venv/
frontend/
src/
package.json
node_modules/
.gitignore
README.md

Getting Started
Backend Setup:

1. Navigate to the backend folder:
   cd backend
2. Create and activate a virtual environment:
   python -m venv venv
   source venv/bin/activate # macOS/Linux
   venv\Scripts\activate # Windows (all of us are macOS though)
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

### Frontend Setup:

Frontend Setup:

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the frontend server:
   ```bash
   npm run dev
   ```
4. Open your browser at http://localhost:3000

API Endpoints

- GET / : Base endpoint (does nothing at the moment)
- Additional endpoints will handle content generation, analytics fetching, and user management

Contributing

1. Clone the repository
2. Create a feature branch:
   git checkout -b ticket
   ex: git checkout -b ENG-123
3. Make your changes and commit:
   git commit -m "action(ticket): description"
   ex: git commit -m "fix(ENG-123): update magic number to constants file"
   ex: git commit -m "feat(ENG-234): add websocket for multiplayer thought dumping"
   ex: git commit -m "chore(ENG-345): migrate constants.js to constants.ts"
   If you don't know how to commit via Vim, ask me
4. Push to your branch and create a Pull Request
   use the template and **include proof**
   ping @SimonNRisk for review
   once approved, merge to main
   monitor deployment in prod
