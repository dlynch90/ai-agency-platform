#!/bin/bash
# Complete setup script for E-commerce Personalization Engine

echo "🚀 Setting up E-commerce Personalization Engine..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 is required but not installed."; exit 1; }

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

# Setup Python environment
echo "Setting up Python environment..."
cd ../ai-engine
python3 -m venv venv
source venv/bin/activate
pip install neo4j sklearn numpy

cd ..

echo "✅ Setup complete! Run './start.sh' to launch the application."
