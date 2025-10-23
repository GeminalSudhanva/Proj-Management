#!/usr/bin/env python3
"""
Quick fix for dependency issues
"""

import subprocess
import sys
import os

def run_pip_command(command):
    """Run pip command and return success status"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ {command}")
            return True
        else:
            print(f"✗ {command}")
            print(f"  Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ {command}")
        print(f"  Exception: {e}")
        return False

def main():
    print("Quick Fix for Project Management Desktop App")
    print("=" * 50)
    
    # Step 1: Create virtual environment if it doesn't exist
    if not os.path.exists("venv"):
        print("\nCreating virtual environment...")
        if not run_pip_command("python -m venv venv"):
            print("Failed to create virtual environment")
            return
    else:
        print("✓ Virtual environment exists")
    
    # Step 2: Activate virtual environment and install dependencies
    print("\nInstalling dependencies in virtual environment...")
    
    # Windows activation
    activate_cmd = "venv\\Scripts\\activate.bat && "
    
    # Uninstall problematic packages first
    packages_to_remove = ["Flask", "Werkzeug", "Flask-WTF", "Flask-Login", "Flask-PyMongo"]
    for package in packages_to_remove:
        run_pip_command(f"{activate_cmd}pip uninstall {package} -y")
    
    # Install compatible versions
    install_commands = [
        "pip install Werkzeug==2.2.3",
        "pip install Flask==2.2.5",
        "pip install Flask-Login==0.6.2",
        "pip install Flask-WTF==1.1.1",
        "pip install Flask-PyMongo==2.3.0",
        "pip install flask-bcrypt==1.0.1",
        "pip install flask-cors==4.0.0",
        "pip install pymongo==4.5.0",
        "pip install passlib==1.7.4",
        "pip install email-validator==2.0.0",
        "pip install python-dotenv==1.0.0",
        "pip install WTForms==3.0.1",
        "pip install PyQt5==5.15.9",
        "pip install PyQtWebEngine==5.15.6"
    ]
    
    for cmd in install_commands:
        if not run_pip_command(f"{activate_cmd}{cmd}"):
            print(f"Failed to install dependencies. Stopping.")
            return
    
    print("\n✓ All dependencies installed successfully!")
    
    # Step 3: Test the installation
    print("\nTesting installation...")
    test_script = """
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'venv', 'Lib', 'site-packages'))

try:
    import flask
    print("✓ Flask imported successfully")
except ImportError as e:
    print(f"✗ Flask import failed: {e}")
    sys.exit(1)

try:
    import werkzeug
    print("✓ Werkzeug imported successfully")
except ImportError as e:
    print(f"✗ Werkzeug import failed: {e}")
    sys.exit(1)

try:
    import PyQt5
    print("✓ PyQt5 imported successfully")
except ImportError as e:
    print(f"✗ PyQt5 import failed: {e}")
    sys.exit(1)

try:
    import PyQt5.QtWebEngineWidgets
    print("✓ PyQtWebEngine imported successfully")
except ImportError as e:
    print(f"✗ PyQtWebEngine import failed: {e}")
    sys.exit(1)

print("\\n✅ All imports successful!")
"""
    
    with open("test_imports.py", "w") as f:
        f.write(test_script)
    
    if run_pip_command(f"{activate_cmd}python test_imports.py"):
        print("\n✅ Installation test passed!")
    else:
        print("\n❌ Installation test failed!")
        return
    
    # Clean up test file
    if os.path.exists("test_imports.py"):
        os.remove("test_imports.py")
    
    print("\n" + "=" * 50)
    print("✅ Quick fix completed successfully!")
    print("\nTo run your desktop app:")
    print("  1. Activate virtual environment: venv\\Scripts\\activate")
    print("  2. Run the app: python run_desktop.py")
    print("  Or use the batch file: run_desktop.bat")

if __name__ == "__main__":
    main() 