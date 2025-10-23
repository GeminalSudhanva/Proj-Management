#!/usr/bin/env python3
"""
Desktop Application Launcher for Project Management System
"""

import sys
import os

def main():
    """Main launcher function"""
    print("Starting Project Management Desktop Application...")
    print("Please wait while the application loads...")
    
    try:
        # Import and run the desktop app
        from desktop_app import main as run_desktop_app
        run_desktop_app()
    except ImportError as e:
        print(f"Error: Missing dependencies. Please install required packages:")
        print("pip install -r requirements.txt")
        print(f"Specific error: {e}")
        input("Press Enter to exit...")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting application: {e}")
        input("Press Enter to exit...")
        sys.exit(1)

if __name__ == "__main__":
    main() 