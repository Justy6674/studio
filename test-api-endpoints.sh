#!/bin/bash

# Test script for API endpoints
echo "🔍 Testing Water4WeightLoss API Endpoints"
echo "========================================="

# Set minimal environment variables for testing
export NODE_ENV=development
export NEXT_PUBLIC_FIREBASE_API_KEY=test-key
export NEXT_PUBLIC_FIREBASE_PROJECT_ID=test-project
export GEMINI_API_KEY=test-gemini-key
export TWILIO_ACCOUNT_SID=test-twilio-sid
export TWILIO_AUTH_TOKEN=test-twilio-token
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_test-key

echo "Environment variables set for testing..."

# Test Firebase config endpoint
echo -e "\n1. Testing /api/firebase-config"
curl -s -w "Status: %{http_code}\n" http://localhost:3000/api/firebase-config 2>/dev/null || echo "❌ Firebase config endpoint not accessible"

# Test Gemini AI endpoint 
echo -e "\n2. Testing /api/generate-motivation"
curl -s -w "Status: %{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"prompt":"test motivation"}' http://localhost:3000/api/generate-motivation 2>/dev/null || echo "❌ Motivation generation endpoint not accessible"

# Test admin gemini endpoint
echo -e "\n3. Testing /api/admin/test-gemini"
curl -s -w "Status: %{http_code}\n" http://localhost:3000/api/admin/test-gemini 2>/dev/null || echo "❌ Admin Gemini test endpoint not accessible"

echo -e "\n✅ API endpoint testing completed"
