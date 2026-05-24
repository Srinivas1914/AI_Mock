#!/bin/bash
echo "🚀 Starting PrepLab Backend..."
pip install -r requirements.txt -q
uvicorn main:app --reload --host 0.0.0.0 --port 8000
