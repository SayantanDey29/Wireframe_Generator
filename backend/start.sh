#!/bin/bash
set -e

echo "🚀 Starting Wireframe Generator Backend..."

# Check for .env file
if [ ! -f ".env" ]; then
  echo "⚠️  No .env file found. Copying from .env.example..."
  cp .env.example .env
  echo "📝 Please edit .env and add your OPENROUTER_API_KEY, then run this script again."
  exit 1
fi

# Check if API key is set
if grep -q "your_openrouter_api_key_here" .env; then
  echo "❌ Please set your OPENROUTER_API_KEY in the .env file."
  echo "   Get a free key at: https://openrouter.ai"
  exit 1
fi

# Create virtual environment if needed
if [ ! -d "venv" ]; then
  echo "📦 Creating virtual environment..."
  python3 -m venv venv
fi

# Activate and install deps
source venv/bin/activate
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt
pip install -q pydantic-settings

echo "✅ Starting FastAPI server on http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
