#!/usr/bin/env python3
"""
Script to generate the correct MongoDB URI for Render deployment
"""

# Your MongoDB Atlas connection details
username = "ukgaming"
password = "Sudhanva@104"
cluster = "cluster0.4xhbbck.mongodb.net"
database = "projectMngmt"

# Generate the connection string
mongo_uri = f"mongodb+srv://{username}:{password}@{cluster}/{database}?retryWrites=true&w=majority"

print("=" * 60)
print("MONGO_URI for Render Environment Variables:")
print("=" * 60)
print(mongo_uri)
print("=" * 60)
print("\nCopy this exact string to your Render environment variables")
print("Make sure to URL encode the @ symbol in the password:")
print("Sudhanva@104 becomes Sudhanva%40104")
print("=" * 60)

# URL encoded version
encoded_uri = f"mongodb+srv://{username}:Sudhanva%40104@{cluster}/{database}?retryWrites=true&w=majority"
print("\nURL ENCODED VERSION:")
print("=" * 60)
print(encoded_uri)
print("=" * 60) 