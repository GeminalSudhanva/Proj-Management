#!/usr/bin/env python3
"""
Script to fix dependency compatibility issues
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error during {description}:")
        print(f"  {e.stderr}")
        return False

def main():
    """Main function to fix dependencies"""
    print("Fixing Project Management Desktop App Dependencies")
    print("=" * 50)
    
    # Check if we're in a virtual environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠ Warning: Not running in a virtual environment")
        print("It's recommended to use a virtual environment for this project")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            return
    
    # Uninstall problematic packages
    print("\nStep 1: Removing incompatible packages...")
    packages_to_remove = [
        "Flask",
        "Werkzeug",
        "Flask-WTF",
        "Flask-Login",
        "Flask-PyMongo"
    ]
    
    for package in packages_to_remove:
        run_command(f"pip uninstall {package} -y", f"Uninstalling {package}")
    
    # Install compatible versions
    print("\nStep 2: Installing compatible versions...")
    
    # Install Werkzeug first (specific version)
    if not run_command("pip install Werkzeug==2.2.3", "Installing Werkzeug 2.2.3"):
        print("Failed to install Werkzeug. Please check your internet connection.")
        return
    
    # Install Flask with compatible version
    if not run_command("pip install Flask==2.2.5", "Installing Flask 2.2.5"):
        print("Failed to install Flask. Please check your internet connection.")
        return
    
    # Install other Flask extensions
    flask_extensions = [
        "Flask-Login==0.6.2",
        "Flask-WTF==1.1.1",
        "Flask-PyMongo==2.3.0",
        "flask-bcrypt==1.0.1",
        "flask-cors==4.0.0"
    ]
    
    for extension in flask_extensions:
        if not run_command(f"pip install {extension}", f"Installing {extension}"):
            print(f"Failed to install {extension}")
            return
    
    # Install remaining dependencies
    print("\nStep 3: Installing remaining dependencies...")
    remaining_deps = [
        "pymongo==4.5.0",
        "passlib==1.7.4",
        "email-validator==2.0.0",
        "python-dotenv==1.0.0",
        "WTForms==3.0.1"
    ]
    
    for dep in remaining_deps:
        if not run_command(f"pip install {dep}", f"Installing {dep}"):
            print(f"Failed to install {dep}")
            return
    
    # Install PyQt5 dependencies
    print("\nStep 4: Installing PyQt5 dependencies...")
    qt_deps = [
        "PyQt5==5.15.9",
        "PyQtWebEngine==5.15.6"
    ]
    
    for qt_dep in qt_deps:
        if not run_command(f"pip install {qt_dep}", f"Installing {qt_dep}"):
            print(f"Failed to install {qt_dep}")
            return
    
    # Test the installation
    print("\nStep 5: Testing the installation...")
    
    test_imports = [
        "import flask",
        "import werkzeug",
        "import PyQt5",
        "import PyQt5.QtWebEngineWidgets"
    ]
    
    for test_import in test_imports:
        try:
            exec(test_import)
            print(f"✓ {test_import} - OK")
        except ImportError as e:
            print(f"✗ {test_import} - FAILED: {e}")
            return
    
    print("\n" + "=" * 50)
    print("✅ Dependency fix completed successfully!")
    print("\nYou can now run your desktop app:")
    print("  python run_desktop.py")
    print("  or double-click run_desktop.bat")

if __name__ == "__main__":
    main() 