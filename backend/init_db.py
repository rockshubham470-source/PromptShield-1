"""Initialize database with default rules"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine
from app.models import Base, Rule
import json

def init_db():
    """Initialize database with default rules"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Define default rules
    default_rules = [
        {
            "name": "Direct Override Keywords",
            "category": "direct_injection",
            "patterns": ["ignore", "disregard", "override", "bypass", "instructions"],
            "weight": 0.85,
            "description": "Detects attempts to override system instructions"
        },
        {
            "name": "Delimiter Injection",
            "category": "delimiter_based",
            "patterns": ["---", "===", "###", "***"],
            "weight": 0.80,
            "description": "Detects delimiter-based injection attempts"
        },
        {
            "name": "Roleplay Jailbreak",
            "category": "roleplay",
            "patterns": ["you are now", "act as if", "pretend", "role-play"],
            "weight": 0.75,
            "description": "Detects roleplay-based jailbreak attempts"
        },
        {
            "name": "Prompt Exposure",
            "category": "prompt_exposure",
            "patterns": ["show prompt", "reveal system", "display instructions", "what's your prompt"],
            "weight": 0.70,
            "description": "Detects attempts to expose system prompts"
        },
        {
            "name": "Context Breakout",
            "category": "context_breakout",
            "patterns": ["new conversation", "restart", "clear context", "forget"],
            "weight": 0.65,
            "description": "Detects context breakout attempts"
        },
        {
            "name": "Token Obfuscation",
            "category": "token_obfuscation",
            "patterns": ["base64", "encode", "hex", "unicode", "escape"],
            "weight": 0.60,
            "description": "Detects token obfuscation techniques"
        },
        {
            "name": "Instruction Replacement",
            "category": "instruction_replacement",
            "patterns": ["new instructions", "update rules", "change behavior"],
            "weight": 0.75,
            "description": "Detects instruction replacement attempts"
        },
        {
            "name": "Authentication Bypass",
            "category": "auth_bypass",
            "patterns": ["admin mode", "sudo", "root access", "bypass auth"],
            "weight": 0.80,
            "description": "Detects authentication bypass attempts"
        },
    ]
    
    # Add rules to database
    for rule_data in default_rules:
        # Check if rule exists
        existing = db.query(Rule).filter(Rule.name == rule_data["name"]).first()
        if not existing:
            rule = Rule(
                name=rule_data["name"],
                category=rule_data["category"],
                patterns=json.dumps(rule_data["patterns"]),
                weight=rule_data["weight"],
                description=rule_data["description"],
                is_enabled=True
            )
            db.add(rule)
            print(f"✓ Added rule: {rule_data['name']}")
    
    db.commit()
    print("\nDatabase initialized successfully")
    db.close()

if __name__ == "__main__":
    init_db()
