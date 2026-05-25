#!/usr/bin/env bash
# exit on error
set -o errexit

# Build React frontend
echo "=== Building Frontend ==="
cd frontend
npm install
npm run build

# Build Python backend
echo "=== Building Backend ==="
cd ../backend
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

echo "=== Build Completed Successfully! ==="
