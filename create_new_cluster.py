#!/usr/bin/env python3
"""
Script to help create a new MongoDB Atlas cluster with proper settings for Render
"""

print("=" * 60)
print("MONGODB ATLAS SETUP FOR RENDER DEPLOYMENT")
print("=" * 60)

print("\n📋 STEP-BY-STEP GUIDE:")
print("1. Go to https://mongodb.com/atlas")
print("2. Sign in to your account")
print("3. Click 'Build a Database'")
print("4. Choose 'FREE' tier (M0 Sandbox)")
print("5. Select any cloud provider (AWS/Google Cloud/Azure)")
print("6. Choose a region close to you")
print("7. Click 'Create'")

print("\n🔧 NETWORK ACCESS SETUP:")
print("1. In left sidebar, click 'Network Access'")
print("2. Click 'Add IP Address'")
print("3. Click 'Allow Access from Anywhere' (0.0.0.0/0)")
print("4. Click 'Confirm'")

print("\n👤 DATABASE ACCESS SETUP:")
print("1. In left sidebar, click 'Database Access'")
print("2. Click 'Add New Database User'")
print("3. Username: projectmanager")
print("4. Password: ProjectMngmt2024!")
print("5. Database User Privileges: 'Read and write to any database'")
print("6. Click 'Add User'")

print("\n🔗 GET CONNECTION STRING:")
print("1. Go back to 'Database' in left sidebar")
print("2. Click 'Connect' on your cluster")
print("3. Choose 'Connect your application'")
print("4. Copy the connection string")
print("5. Replace <password> with: ProjectMngmt2024!")
print("6. Add /projectMngmt before the ?")

print("\n✅ FINAL CONNECTION STRING SHOULD LOOK LIKE:")
print("mongodb+srv://projectmanager:ProjectMngmt2024!@cluster0.xxxxx.mongodb.net/projectMngmt?retryWrites=true&w=majority")

print("\n🚀 UPDATE RENDER ENVIRONMENT VARIABLES:")
print("1. Go to https://render.com")
print("2. Click on your service: proj-management")
print("3. Go to 'Environment' tab")
print("4. Update MONGO_URI with the new connection string")
print("5. Wait for redeployment")

print("\n" + "=" * 60) 