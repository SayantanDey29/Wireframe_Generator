#!/bin/bash
set -e

echo "🎨 Starting Wireframe Generator Frontend..."

# Install deps
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  npm install
fi

echo "✅ Starting React dev server on http://localhost:3000"
npm start
