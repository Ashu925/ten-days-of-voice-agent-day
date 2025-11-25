#!/bin/bash

# Start all services in background
livekit-server --dev &
(cd backend && uv run python src/agent.py dev) &
(cd frontend && pnpm dev) &

# Wait for all background jobs
wait
Set-Location 'C:\Users\ayush\OneDrive\Desktop\ten-days-of-voice-agents-2025\backend'
# Activate venv (PowerShell)
.\.venv\Scripts\Activate.ps1
# Run the agent (dev arg)
python .\src\agent.py dev