#!/bin/bash

# Setup script for new developers
# This script sets up the backend virtual environment and installs all dependencies

set -e  # Exit on error

echo "Setting up qtma25 project..."

# Backend Setup
echo ""
echo "Setting up backend..."
cd backend

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists, skipping creation..."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Backend setup complete!"
echo ""

# Frontend Setup
cd ../frontend
echo "Setting up frontend..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed. Please install npm first."
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

echo "Frontend setup complete!"
echo ""

cd ..

echo "Setup complete!"
echo ""
echo "To run the project:"
echo ""
echo "Backend (in one terminal):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload --port 8000"
echo ""
echo "Frontend (in another terminal):"
echo "  cd frontend"
echo "  npm run dev"
echo ""

