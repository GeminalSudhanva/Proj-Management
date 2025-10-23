#!/usr/bin/env python3
"""
Setup script for Project Management Desktop Application
"""

import os
import sys
import subprocess
import platform

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("Error: Python 3.7 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✓ Python {sys.version.split()[0]} detected")
    return True

def check_mongodb():
    """Check if MongoDB is accessible"""
    try:
        import pymongo
        client = pymongo.MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
        client.server_info()
        print("✓ MongoDB connection successful")
        return True
    except Exception as e:
        print("⚠ MongoDB connection failed")
        print("Please ensure MongoDB is running on localhost:27017")
        print("Or update your .env file with correct MONGO_URI")
        return False

def install_dependencies():
    """Install required dependencies"""
    print("\nInstalling dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing dependencies: {e}")
        return False

def create_env_file():
    """Create .env file if it doesn't exist"""
    if not os.path.exists(".env"):
        print("\nCreating .env file...")
        env_content = """# Project Management Desktop App Configuration
SECRET_KEY=your-secret-key-change-this-in-production
MONGO_URI=mongodb://localhost:27017/projectMngmt
"""
        with open(".env", "w") as f:
            f.write(env_content)
        print("✓ .env file created")
        print("⚠ Please update SECRET_KEY in .env file for production use")
    else:
        print("✓ .env file already exists")

def test_imports():
    """Test if all required modules can be imported"""
    print("\nTesting imports...")
    try:
        import PyQt5
        import PyQt5.QtWebEngineWidgets
        import flask
        import pymongo
        print("✓ All required modules imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def main():
    """Main setup function"""
    print("Project Management Desktop App Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("\nPlease try installing dependencies manually:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    
    # Test imports
    if not test_imports():
        print("\nPlease try installing dependencies manually:")
        print("pip install PyQt5==5.15.9 PyQtWebEngine==5.15.6")
        sys.exit(1)
    
    # Create .env file
    create_env_file()
    
    # Check MongoDB
    check_mongodb()
    
    print("\n" + "=" * 40)
    print("Setup completed successfully!")
    print("\nTo run the desktop app:")
    print("  python run_desktop.py")
    print("  or double-click run_desktop.bat (Windows)")
    print("\nTo run the web version:")
    print("  python app.py")

if __name__ == "__main__":
    main() 