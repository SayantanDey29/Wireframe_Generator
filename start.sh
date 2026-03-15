#!/bin/bash
# Start both backend and frontend in parallel

echo "======================================"
echo "  Wireframe Generator - Full Stack"
echo "======================================"
echo ""

# Check OS for open command
open_cmd=""
if command -v xdg-open &> /dev/null; then
  open_cmd="xdg-open"
elif command -v open &> /dev/null; then
  open_cmd="open"
fi

# Start backend in background
echo "Starting backend..."
cd backend
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  ACTION REQUIRED:"
  echo "   1. Open backend/.env"
  echo "   2. Replace 'your_openrouter_api_key_here' with your real key"
  echo "   3. Get a free key at https://openrouter.ai"
  echo "   4. Run this script again"
  echo ""
  exit 1
fi

# Setup python venv
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt pydantic-settings
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  npm install
fi
BROWSER=none npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both services started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Open browser after delay
if [ -n "$open_cmd" ]; then
  sleep 5 && $open_cmd http://localhost:3000 &
fi

# Wait and cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
