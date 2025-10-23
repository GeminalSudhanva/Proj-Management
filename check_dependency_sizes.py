#!/usr/bin/env python3
"""
Script to check approximate download sizes of dependencies
"""

import requests
import json
from packaging import version

def get_package_info(package_name, version_spec=None):
    """Get package information from PyPI"""
    try:
        url = f"https://pypi.org/pypi/{package_name}/json"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            
            if version_spec:
                # Find the specific version
                for release in data['releases']:
                    if version.parse(release) == version.parse(version_spec):
                        files = data['releases'][release]
                        if files:
                            # Get the wheel file size (preferred)
                            wheel_files = [f for f in files if f['packagetype'] == 'bdist_wheel']
                            if wheel_files:
                                return {
                                    'name': package_name,
                                    'version': release,
                                    'size_mb': wheel_files[0]['size'] / (1024 * 1024),
                                    'url': wheel_files[0]['url']
                                }
                            # Fallback to source distribution
                            source_files = [f for f in files if f['packagetype'] == 'sdist']
                            if source_files:
                                return {
                                    'name': package_name,
                                    'version': release,
                                    'size_mb': source_files[0]['size'] / (1024 * 1024),
                                    'url': source_files[0]['url']
                                }
            else:
                # Get latest version
                latest = data['info']['version']
                files = data['releases'][latest]
                if files:
                    wheel_files = [f for f in files if f['packagetype'] == 'bdist_wheel']
                    if wheel_files:
                        return {
                            'name': package_name,
                            'version': latest,
                            'size_mb': wheel_files[0]['size'] / (1024 * 1024),
                            'url': wheel_files[0]['url']
                        }
    except Exception as e:
        print(f"Error getting info for {package_name}: {e}")
    
    return None

def main():
    """Main function to check dependency sizes"""
    print("Project Management Desktop App - Dependency Size Check")
    print("=" * 60)
    
    # Dependencies with versions
    dependencies = [
        ("Flask", "2.3.3"),
        ("Flask-PyMongo", "2.3.0"),
        ("Flask-Login", "0.6.2"),
        ("Flask-WTF", "1.1.1"),
        ("pymongo", "4.5.0"),
        ("passlib", "1.7.4"),
        ("email-validator", "2.0.0"),
        ("python-dotenv", "1.0.0"),
        ("WTForms", "3.0.1"),
        ("flask-bcrypt", "1.0.1"),
        ("flask-cors", "4.0.0"),
        ("PyQt5", "5.15.9"),
        ("PyQtWebEngine", "5.15.6")
    ]
    
    print("\nChecking package sizes...")
    print("-" * 60)
    
    total_size = 0
    package_info = []
    
    for package, version_spec in dependencies:
        info = get_package_info(package, version_spec)
        if info:
            size_mb = info['size_mb']
            total_size += size_mb
            package_info.append(info)
            print(f"{package:20} {version_spec:10} {size_mb:8.1f} MB")
        else:
            print(f"{package:20} {version_spec:10} {'N/A':>8}")
    
    print("-" * 60)
    print(f"{'TOTAL':20} {'':10} {total_size:8.1f} MB")
    
    # Additional dependencies that PyQt5 will pull in
    print("\nAdditional dependencies that will be installed automatically:")
    print("-" * 60)
    
    qt_dependencies = [
        ("PyQt5-Qt5", "5.15.2"),
        ("PyQt5-sip", "12.12.2"),
        ("PyQtWebEngine-Qt5", "5.15.2")
    ]
    
    qt_total = 0
    for package, version_spec in qt_dependencies:
        info = get_package_info(package, version_spec)
        if info:
            size_mb = info['size_mb']
            qt_total += size_mb
            print(f"{package:20} {version_spec:10} {size_mb:8.1f} MB")
    
    print("-" * 60)
    print(f"{'QT TOTAL':20} {'':10} {qt_total:8.1f} MB")
    
    grand_total = total_size + qt_total
    print(f"\n{'GRAND TOTAL':20} {'':10} {grand_total:8.1f} MB")
    
    # Size categories
    print("\nSize Categories:")
    if grand_total < 100:
        print("🟢 Small (< 100 MB) - Quick download")
    elif grand_total < 500:
        print("🟡 Medium (100-500 MB) - Moderate download time")
    else:
        print("🔴 Large (> 500 MB) - May take some time to download")
    
    print(f"\nEstimated download time (assuming 10 Mbps connection):")
    download_time_minutes = (grand_total * 8) / (10 * 60)  # Convert to minutes
    print(f"⏱️  Approximately {download_time_minutes:.1f} minutes")

if __name__ == "__main__":
    main() 