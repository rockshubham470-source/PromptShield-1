"""
Vercel Python serverless entry point for the PromptShield FastAPI backend.
Vercel picks up any file inside /api/ and serves it as a serverless function.
"""
import sys
import os

# Make sure the backend package root is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: F401 — Vercel looks for `app` or `handler`

# Vercel Python runtime accepts both names
handler = app
