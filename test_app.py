#!/usr/bin/env python3
"""
Test script to verify the Flask app works correctly
"""

import sys
import os

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    
    try:
        import flask
        print("✓ Flask imported successfully")
    except ImportError as e:
        print(f"✗ Flask import failed: {e}")
        return False
    
    try:
        import werkzeug
        print("✓ Werkzeug imported successfully")
    except ImportError as e:
        print(f"✗ Werkzeug import failed: {e}")
        return False
    
    try:
        import PyQt5
        print("✓ PyQt5 imported successfully")
    except ImportError as e:
        print(f"✗ PyQt5 import failed: {e}")
        return False
    
    try:
        import PyQt5.QtWebEngineWidgets
        print("✓ PyQtWebEngine imported successfully")
    except ImportError as e:
        print(f"✗ PyQtWebEngine import failed: {e}")
        return False
    
    return True

def test_flask_app():
    """Test if the Flask app can be imported and initialized"""
    print("\nTesting Flask app...")
    
    try:
        import app
        print("✓ Flask app imported successfully")
        
        # Test if the app has the required configuration
        if hasattr(app, 'app'):
            print("✓ Flask app instance found")
            return True
        else:
            print("✗ Flask app instance not found")
            return False
            
    except Exception as e:
        print(f"✗ Flask app import failed: {e}")
        return False

def main():
    """Main test function"""
    print("Project Management App - Dependency Test")
    print("=" * 40)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import test failed!")
        return False
    
    # Test Flask app
    if not test_flask_app():
        print("\n❌ Flask app test failed!")
        return False
    
    print("\n✅ All tests passed!")
    print("\nYou can now run your desktop app:")
    print("  python run_desktop.py")
    print("  or double-click run_desktop.bat")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 