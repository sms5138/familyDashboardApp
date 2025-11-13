#!/bin/bash

# Test script to verify the storage server API

echo "🧪 Testing Family Dashboard API"
echo "================================"

# Test 1: Health check
echo ""
echo "1️⃣ Testing health endpoint..."
curl -s http://localhost:3001/api/health | python3 -m json.tool

# Test 2: Get users
echo ""
echo ""
echo "2️⃣ Testing get users endpoint..."
curl -s http://localhost:3001/api/users | python3 -m json.tool

echo ""
echo ""
echo "✅ Tests complete!"
echo ""
echo "💡 If you see errors, make sure the storage server is running:"
echo "   cd storage-server && npm start"
