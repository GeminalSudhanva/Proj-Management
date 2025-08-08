#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys

print("Testing Flask app import...")

try:
    import app
    print("SUCCESS: Flask app imported successfully")
    print("You can now run your desktop app!")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1) 