#!/bin/bash

echo "Starting BgUtil PO Token Provider Server..."
cd third_party/bgutil-ytdlp-pot-provider/server
mkdir -p ../../../third_party/logs
: > ../../../third_party/logs/pot-provider.log
node build/main.js >> ../../../third_party/logs/pot-provider.log 2>&1 &
PO_PROVIDER_PID=$!
cd ../../..

echo "PO Token Provider started (PID: $PO_PROVIDER_PID)"
echo "Waiting 5 seconds for provider to initialize..."
sleep 5

echo ""
echo "Starting zen-bot..."
node main.js

# When zen-bot stops, also stop the PO provider
echo ""
echo "Stopping PO Token Provider..."
kill $PO_PROVIDER_PID 2>/dev/null
