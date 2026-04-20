#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Backend Dependencies
echo "Installing Node.js dependencies..."
cd backend
npm install
cd ..

# Install Python Dependencies
echo "Installing Python dependencies..."
cd agent_v2
pip install -r requirements.txt
cd ..

echo "Build Complete!"
