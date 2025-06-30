#!/bin/bash

# Source the config file
source "$(dirname "$0")/config.sh"

if [ -z "$MODAL_CREATE_API" ] || [ -z "$MODAL_QUERY_API" ]; then
  echo "Error: MODAL_CREATE_API and MODAL_QUERY_API must be set in the config file."
  exit 1
fi

# Check if source and target files are provided
if [ $# -lt 2 ]; then
  echo "Usage: $0 <source_file> <target_file>"
  echo "Example: $0 [public/assets/]image.png [public/assets/]video.mp4"
  exit 1
fi

SOURCE_FILE="${ASSET_DIR}/$1"
TARGET_FILE="${ASSET_DIR}/$2"

MAX_RETRIES=60
POLLING_INTERVAL=8  # seconds


# Validate file existence
if [ ! -f "$SOURCE_FILE" ]; then
  echo "Error: Source file does not exist: $SOURCE_FILE"
  exit 1
fi

if [ ! -f "$TARGET_FILE" ]; then
  echo "Error: Target file does not exist: $TARGET_FILE"
  exit 1
fi

echo "[CREATE] Creating fusion task with source and target files"
echo "[CREATE] Source: $SOURCE_FILE"
echo "[CREATE] Target: $TARGET_FILE"

# Step 1: Create face fusion task
CREATE_RESPONSE=$(curl -s -X POST \
  -F "source=@$SOURCE_FILE" \
  -F "target=@$TARGET_FILE" \
  "$CREATE_API")

# Check if the request was successful
if [ $? -ne 0 ]; then
  echo "[CREATE ERROR] Failed to connect to the API"
  exit 1
fi

# Extract output_path from response
OUTPUT_PATH=$(echo "$CREATE_RESPONSE" | grep -o '"output_path":"[^"]*"' | sed 's/"output_path":"//;s/"//')

if [ -z "$OUTPUT_PATH" ]; then
  echo "[CREATE ERROR] Failed to get output_path from response:"
  echo "$CREATE_RESPONSE"
  exit 1
fi

echo "[CREATE] Task created successfully with output path: $OUTPUT_PATH"

# Step 2: Poll for results
echo "[POLL] Starting to poll for results with outputPath: $OUTPUT_PATH"

retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
  # Calculate progress percentage
  progress_percentage=$((retry_count * 100 / MAX_RETRIES))
  echo "[POLL] Progress: ${progress_percentage}% (Attempt $((retry_count + 1))/$MAX_RETRIES)"
  
  # Make the API request to check status
  POLL_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"output_path\":\"$OUTPUT_PATH\"}" \
    "$QUERY_API")
  
  # Check if the response contains a status field (JSON response)
  if echo "$POLL_RESPONSE" | grep -q '"status"'; then
    # Extract status from response
    STATUS=$(echo "$POLL_RESPONSE" | grep -o '"status":"[^"]*"' | sed 's/"status":"//;s/"//')
    
    if [ "$STATUS" = "processing" ] || [ "$STATUS" = "pending" ]; then
      # Still processing, wait and retry
      echo "[POLL] Task still $STATUS, waiting before next poll..."
      retry_count=$((retry_count + 1))
      sleep $POLLING_INTERVAL
      continue
    elif [ "$STATUS" = "completed" ]; then
      # Task completed with a JSON response containing output_url
      echo "[POLL] Task completed successfully"
      
      # Extract output_url if available
      OUTPUT_URL=$(echo "$POLL_RESPONSE" | grep -o '"output_url":"[^"]*"' | sed 's/"output_url":"//;s/"//')
      if [ -n "$OUTPUT_URL" ]; then
        echo "[POLL] Output URL: $OUTPUT_URL"
        
        # Download the result
        OUTPUT_FILENAME="result_$(date +%s).mp4"
        echo "[DOWNLOAD] Downloading result to $OUTPUT_FILENAME"
        curl -s -o "$OUTPUT_FILENAME" "$OUTPUT_URL"
        
        if [ $? -eq 0 ]; then
          echo "[DOWNLOAD] Download completed successfully: $OUTPUT_FILENAME"
          echo "Result saved to: $(realpath "$OUTPUT_FILENAME")"
          exit 0
        else
          echo "[DOWNLOAD ERROR] Failed to download result"
          exit 1
        fi
      else
        echo "[POLL] No output URL found in response:"
        echo "$POLL_RESPONSE"
        exit 1
      fi
    elif [ "$STATUS" = "failed" ]; then
      # Task failed with an error
      ERROR=$(echo "$POLL_RESPONSE" | grep -o '"error":"[^"]*"' | sed 's/"error":"//;s/"//')
      echo "[POLL ERROR] Task failed: ${ERROR:-Unknown processing error}"
      exit 1
    else
      # Unknown status
      echo "[POLL WARNING] Unknown task status: $STATUS"
      retry_count=$((retry_count + 1))
      sleep $POLLING_INTERVAL
      continue
    fi
  elif [ "$(curl -s -I -X POST -H "Content-Type: application/json" -d "{\"output_path\":\"$OUTPUT_PATH\"}" "$QUERY_API" | grep "HTTP" | awk '{print $2}')" -eq 200 ]; then
    # Direct binary response (200 status) means the file is ready
    echo "[POLL] Received direct binary response - file is ready"
    
    # Download the result
    OUTPUT_FILENAME="result_$(date +%s).mp4"
    echo "[DOWNLOAD] Downloading result to $OUTPUT_FILENAME"
    curl -s -X POST \
      -H "Content-Type: application/json" \
      -d "{\"output_path\":\"$OUTPUT_PATH\"}" \
      -o "$OUTPUT_FILENAME" \
      "$QUERY_API"
    
    if [ $? -eq 0 ]; then
      echo "[DOWNLOAD] Download completed successfully: $OUTPUT_FILENAME"
      echo "Result saved to: $(realpath "$OUTPUT_FILENAME")"
      exit 0
    else
      echo "[DOWNLOAD ERROR] Failed to download result"
      exit 1
    fi
  else
    # Error response or unknown format
    echo "[POLL WARNING] Unexpected response format:"
    echo "$POLL_RESPONSE"
    retry_count=$((retry_count + 1))
    sleep $POLLING_INTERVAL
    continue
  fi
done

# If we've reached maximum retries
echo "[POLL ERROR] Maximum retries ($MAX_RETRIES) reached without success"
echo "Task timed out after $((MAX_RETRIES * POLLING_INTERVAL)) seconds"
exit 1
