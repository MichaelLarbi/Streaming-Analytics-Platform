#!/bin/bash

# This script tests the API Gateway rate limiting by sending concurrent requests

# Replace with your API Gateway URL after deployment
API_URL=$1

if [ -z "$API_URL" ]; then
    echo "Please provide the API URL as an argument"
    exit 1
fi

# Function to send requests
send_requests() {
    for i in {1..10}; do
        curl -w "\n" $API_URL &
    done
    wait
}

echo "Starting rate limit test..."
echo "Sending first batch of concurrent requests..."
send_requests

echo "Waiting 1 second..."
sleep 1

echo "Sending second batch of concurrent requests..."
send_requests

echo "Test complete."