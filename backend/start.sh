#!/bin/bash

# Run from backend directory (so venv and main.py are found)
cd "$(dirname "$0")"

# Use venv's Python (no --reload: reload subprocess often uses Anaconda and misses venv packages)
if [ -d "venv" ]; then
    echo "Using virtual environment..."
    PYTHON=venv/bin/python
else
    echo "Warning: venv not found. Install with: python -m venv venv && venv/bin/pip install -r requirements.txt"
    PYTHON=python
fi

# Start the FastAPI server (single process so venv packages are always used)
echo "Starting FastAPI server on http://localhost:8000"
exec "$PYTHON" -m uvicorn main:app --port 8000 --host 0.0.0.0