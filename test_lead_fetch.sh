#!/bin/bash
# Login
ID="a3eb8d40-1593-40d2-bb21-d57808a4f8e0"
echo "Logging in..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amarillosecurity.com","password":"admin123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo "Login failed"
  exit 1
fi

echo "Fetching Lead $ID..."
curl -v http://localhost:3001/api/leads/$ID \
  -H "Authorization: Bearer $TOKEN"
