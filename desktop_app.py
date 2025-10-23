import sys
import os
import threading
import time
from PyQt5.QtWidgets import (QApplication, QMainWindow, QVBoxLayout, 
                             QWidget, QPushButton, QLabel, QHBoxLayout,
                             QSystemTrayIcon, QMenu, QAction, QMessageBox)
from PyQt5.QtCore import QUrl, QTimer, pyqtSignal, QThread
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtGui import QIcon, QFont
from PyQt5.QtCore import Qt
import webbrowser
from flask import Flask
import app  # Import your existing Flask app

class FlaskThread(QThread):
    """Thread to run Flask app in background"""
    def __init__(self):
        super().__init__()
        self.app = app.app  # Your Flask app instance
        
    def run(self):
        # Run Flask app on localhost
        self.app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)

class ProjectManagementApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Project Management Desktop App")
        self.setGeometry(100, 100, 1200, 800)
        
        # Set window icon (you can add your own icon file)
        # self.setWindowIcon(QIcon('icon.png'))
        
        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Create layout
        layout = QVBoxLayout(central_widget)
        
        # Create header
        header_layout = QHBoxLayout()
        
        # App title
        title_label = QLabel("Project Management System")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setAlignment(Qt.AlignCenter)
        
        # Control buttons
        refresh_btn = QPushButton("Refresh")
        refresh_btn.clicked.connect(self.refresh_webview)
        
        open_browser_btn = QPushButton("Open in Browser")
        open_browser_btn.clicked.connect(self.open_in_browser)
        
        header_layout.addWidget(title_label)
        header_layout.addWidget(refresh_btn)
        header_layout.addWidget(open_browser_btn)
        
        layout.addLayout(header_layout)
        
        # Create web view
        self.web_view = QWebEngineView()
        layout.addWidget(self.web_view)
        
        # Start Flask server in background thread
        self.flask_thread = FlaskThread()
        self.flask_thread.start()
        
        # Wait a moment for Flask to start, then load the app
        QTimer.singleShot(2000, self.load_app)
        
        # Create system tray
        self.setup_system_tray()
        
        # Status bar
        self.statusBar().showMessage("Starting application...")
        
    def load_app(self):
        """Load the Flask app in the web view"""
        try:
            self.web_view.load(QUrl("http://127.0.0.1:5000"))
            self.statusBar().showMessage("Application loaded successfully")
        except Exception as e:
            self.statusBar().showMessage(f"Error loading app: {str(e)}")
    
    def refresh_webview(self):
        """Refresh the web view"""
        self.web_view.reload()
        self.statusBar().showMessage("Page refreshed")
    
    def open_in_browser(self):
        """Open the app in default browser"""
        webbrowser.open("http://127.0.0.1:5000")
        self.statusBar().showMessage("Opened in browser")
    
    def setup_system_tray(self):
        """Setup system tray icon and menu"""
        self.tray_icon = QSystemTrayIcon(self)
        # self.tray_icon.setIcon(QIcon('icon.png'))  # Add your icon
        
        # Create tray menu
        tray_menu = QMenu()
        
        show_action = QAction("Show", self)
        show_action.triggered.connect(self.show)
        tray_menu.addAction(show_action)
        
        quit_action = QAction("Quit", self)
        quit_action.triggered.connect(self.quit_app)
        tray_menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.show()
    
    def quit_app(self):
        """Quit the application"""
        reply = QMessageBox.question(self, 'Quit', 
                                   'Are you sure you want to quit?',
                                   QMessageBox.Yes | QMessageBox.No,
                                   QMessageBox.No)
        
        if reply == QMessageBox.Yes:
            # Stop Flask thread
            if hasattr(self, 'flask_thread'):
                self.flask_thread.terminate()
                self.flask_thread.wait()
            
            QApplication.quit()
    
    def closeEvent(self, event):
        """Handle window close event"""
        # Hide to system tray instead of closing
        self.hide()
        self.tray_icon.showMessage(
            "Project Management App",
            "Application minimized to system tray",
            QSystemTrayIcon.Information,
            2000
        )
        event.ignore()
    
    def changeEvent(self, event):
        """Handle window state change"""
        if event.type() == event.WindowStateChange:
            if self.isMinimized():
                self.hide()
                self.tray_icon.showMessage(
                    "Project Management App",
                    "Application minimized to system tray",
                    QSystemTrayIcon.Information,
                    2000
                )
                event.ignore()

def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Project Management Desktop App")
    app.setApplicationVersion("1.0")
    
    # Set application style
    app.setStyle('Fusion')
    
    window = ProjectManagementApp()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == "__main__":
    main() 