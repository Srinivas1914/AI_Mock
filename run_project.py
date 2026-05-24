"""
PrepLab Orchestrator — Combined Runner Script
Installs dependencies, builds the frontend, and runs the unified FastAPI + React server.
"""

import os
import sys
import subprocess
import shutil

# Ensure UTF-8 output encoding for emojis in Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def log(emoji, text):
    print(f"\n{emoji} {text}")
    sys.stdout.flush()

def run_command(cmd, cwd=None):
    try:
        # Use shell=True for windows compatibility
        res = subprocess.run(cmd, shell=True, check=True, cwd=cwd)
        return res.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
        print(e)
        return False

def main():
    log("◈", "Starting PrepLab Combined Runner...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")
    
    # ── 1. CHECK BACKEND DEPENDENCIES ──────────────────────────────────────────
    log("🐍", "Installing/Verifying Python dependencies...")
    req_file = os.path.join(backend_dir, "requirements.txt")
    if os.path.exists(req_file):
        success = run_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], cwd=backend_dir)
        if not success:
            log("❌", "Failed to install Python dependencies. Continuing anyway...")
    
    # ── 2. INSTALL FRONTEND DEPENDENCIES ────────────────────────────────────────
    node_modules_dir = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules_dir):
        log("📦", "node_modules not found. Installing frontend dependencies (npm install)...")
        success = run_command(["npm", "install"], cwd=frontend_dir)
        if not success:
            log("❌", "Failed to install frontend dependencies. Please ensure Node.js and npm are installed.")
            sys.exit(1)
    else:
        log("📦", "Frontend dependencies already installed.")

    # ── 3. BUILD FRONTEND ──────────────────────────────────────────────────────
    log("⚡", "Building React frontend with Vite...")
    success = run_command(["npm", "run", "build"], cwd=frontend_dir)
    if not success:
        log("❌", "Frontend build failed. Please check build logs.")
        sys.exit(1)
    
    dist_dir = os.path.join(frontend_dir, "dist")
    if not os.path.exists(dist_dir):
        log("❌", f"Build finished but {dist_dir} was not created!")
        sys.exit(1)
        
    log("✅", "Frontend built successfully!")
    
    # ── 4. START COMBINED SERVER ───────────────────────────────────────────────
    log("🚀", "Starting the combined server on http://localhost:8000 ...")
    main_py = os.path.join(backend_dir, "main.py")
    
    # Execute the python main.py directly so it stays interactive and shows hot-reload logs
    try:
        subprocess.run([sys.executable, "main.py"], cwd=backend_dir, shell=True)
    except KeyboardInterrupt:
        log("👋", "PrepLab server stopped.")

if __name__ == "__main__":
    main()
