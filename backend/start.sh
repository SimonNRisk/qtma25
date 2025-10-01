#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Start the FastAPI server
echo "Starting FastAPI server on http://localhost:8000"
uvicorn main:app --reload --port 8000 --host 0.0.0.0