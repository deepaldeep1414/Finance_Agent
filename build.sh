#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd backend
npm install

# Go back to root and install Python dependencies
echo "Installing Python dependencies..."
cd ..
pip install -r agent_v2/requirements.txt
pip install -r requirements.txt

echo "Build Complete!"
