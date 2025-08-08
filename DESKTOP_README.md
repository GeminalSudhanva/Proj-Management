# Project Management Desktop Application

This is the desktop version of your Project Management System. It wraps your existing Flask web application in a native desktop window using PyQt5.

## Features

- **Native Desktop Interface**: Your web app runs in a desktop window
- **System Tray Integration**: Minimize to system tray
- **Browser Integration**: Option to open in external browser
- **Refresh Functionality**: Easy refresh button
- **Cross-platform**: Works on Windows, macOS, and Linux

## Installation

### Prerequisites

1. **Python 3.7+** installed on your system
2. **MongoDB** running locally or accessible via connection string

### Quick Start (Windows)

1. Double-click `run_desktop.bat` to automatically:
   - Create virtual environment
   - Install dependencies
   - Launch the desktop app

### Manual Installation

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment**:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables** (create `.env` file):
   ```
   SECRET_KEY=your-secret-key-here
   MONGO_URI=mongodb://localhost:27017/projectMngmt
   ```

## Running the Desktop App

### Method 1: Using the launcher script
```bash
python run_desktop.py
```

### Method 2: Direct execution
```bash
python desktop_app.py
```

### Method 3: Windows batch file
Double-click `run_desktop.bat`

## Desktop App Features

### Main Window
- **Title Bar**: Shows "Project Management Desktop App"
- **Header**: Contains app title and control buttons
- **Web View**: Displays your Flask application
- **Status Bar**: Shows application status

### Control Buttons
- **Refresh**: Reloads the current page
- **Open in Browser**: Opens the app in your default web browser

### System Tray
- **Minimize to Tray**: Close button minimizes to system tray
- **Tray Menu**: Right-click tray icon for options
- **Show/Quit**: Control app visibility and exit

### Window Behavior
- **Minimize**: Automatically minimizes to system tray
- **Close**: Hides to system tray instead of closing
- **Quit**: Use tray menu or confirmation dialog to fully exit

## Troubleshooting

### Common Issues

1. **PyQt5 Installation Error**:
   ```bash
   pip install PyQt5==5.15.9 PyQtWebEngine==5.15.6
   ```

2. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check your `.env` file for correct `MONGO_URI`

3. **Port Already in Use**:
   - The app uses port 5000
   - Close other applications using this port
   - Or modify the port in `desktop_app.py`

4. **Web View Not Loading**:
   - Wait 2-3 seconds for Flask to start
   - Check if port 5000 is accessible
   - Try the "Open in Browser" button

### Error Messages

- **"Missing dependencies"**: Run `pip install -r requirements.txt`
- **"Flask app not found"**: Ensure `app.py` is in the same directory
- **"Port already in use"**: Close other applications on port 5000

## Development

### Modifying the Desktop App

The desktop wrapper is in `desktop_app.py`. Key components:

- `FlaskThread`: Runs Flask app in background
- `ProjectManagementApp`: Main desktop window
- `QWebEngineView`: Embeds web content

### Adding Features

- **Custom Icons**: Add icon files and uncomment icon lines
- **Additional Buttons**: Modify the header layout
- **Custom Styling**: Modify PyQt5 stylesheets

## Distribution

### Creating Executable

To create a standalone executable:

1. **Install PyInstaller**:
   ```bash
   pip install pyinstaller
   ```

2. **Create executable**:
   ```bash
   pyinstaller --onefile --windowed --name "ProjectManagement" run_desktop.py
   ```

3. **Distribute**: The executable will be in `dist/` folder

### Requirements for Distribution

- Include MongoDB installation instructions
- Provide `.env` file template
- Include any static files and templates

## Differences from Web Version

| Feature | Web Version | Desktop Version |
|---------|-------------|-----------------|
| Access | Browser | Native Window |
| System Integration | Limited | Full (tray, notifications) |
| Offline Capability | No | Partial (cached content) |
| Updates | Browser refresh | App restart required |
| Installation | None | Python + dependencies |

## Support

For issues specific to the desktop app:
1. Check the console output for error messages
2. Verify all dependencies are installed
3. Ensure MongoDB is running
4. Try running the web version first to isolate issues

## License

Same as your original project - the desktop wrapper is open source and can be modified as needed. 