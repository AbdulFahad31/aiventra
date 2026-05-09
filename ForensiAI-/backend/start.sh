#!/bin/bash
# ForensiAI Backend Startup Script for macOS/Linux

echo ""
echo "================================================"
echo "ForensiAI Backend - Startup Script"
echo "================================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[*] Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "[*] Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to activate virtual environment"
    exit 1
fi

# Install requirements
echo "[*] Installing dependencies..."
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "[!] No .env file found"
    echo "[*] Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "[!] IMPORTANT: Edit .env and add your Featherless API key"
    echo "    FEATHERLESS_API_KEY=your_api_key_here"
    echo ""
fi

# Start backend
echo ""
echo "================================================"
echo "[*] Starting ForensiAI Backend..."
echo "[*] Backend: http://localhost:8000"
echo "[*] API Docs: http://localhost:8000/docs"
echo "================================================"
echo ""

python main.py
