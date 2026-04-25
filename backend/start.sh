#!/bin/bash
echo "Starting model download..."
node src/download-models.js
echo "Starting server..."
node src/server.js