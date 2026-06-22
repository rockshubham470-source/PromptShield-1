#!/usr/bin/env python3
"""Script to fix the usage_metrics table schema"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine
from sqlalchemy import text

def fix_usage_metrics_table():
    """Add last_request_at column to usage_metrics table if it doesn't exist"""
    with engine.connect() as conn:
        # Check if column exists
        result = conn.execute(text("""
            SELECT COUNT(*)
            FROM pragma_table_info('usage_metrics')
            WHERE name = 'last_request_at'
        """))
        column_exists = result.scalar() > 0

        if not column_exists:
            print("Adding last_request_at column to usage_metrics table...")
            conn.execute(text("ALTER TABLE usage_metrics ADD COLUMN last_request_at DATETIME"))
            conn.commit()
            print("✓ Column added successfully")
        else:
            print("✓ last_request_at column already exists")

if __name__ == "__main__":
    fix_usage_metrics_table()