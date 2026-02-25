#!/bin/bash
# Auto-detect what to run based on environment

# If NODE_ENV is "frontend" or package says preview, run frontend
if [ "$NODE_ENV" = "frontend" ] || [ -f "dist/index.html" ]; then
  echo "Starting frontend server..."
  exec npm run preview
else
  echo "Starting API backend..."
  exec node api.js
fi
