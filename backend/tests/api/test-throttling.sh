#!/bin/bash

# Replace with your API URL
API_URL="$1"

# Increased number of requests
NUM_REQUESTS=1500

# Function to make request and extract status code
make_request() {
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")
    echo "$(date +%H:%M:%S.%3N) - Status: $status"
}

# Make requests in parallel with minimal delay
for ((i=1; i<=NUM_REQUESTS; i++)); do
    make_request &
    # Reduced sleep time to increase request rate
    sleep 0.01
done

# Wait for all background processes to complete
wait

echo "Test completed!"
