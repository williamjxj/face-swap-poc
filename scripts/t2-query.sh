#!/usr/bin/env bash

source "$(dirname "$0")/config.sh"

# Configuration
MAX_RETRIES=60           # 6 minutes maximum (8 seconds × 60)
POLLING_INTERVAL=8       # 8 seconds
OUTPUT_FILE=""           # Default empty, will be set with -o option

# Get output_path from command line argument and parse options
output_path=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -o|--output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 <output_path> [-o output_file]"
      echo "  <output_path>       The output_path returned from t1-create.sh"
      echo "  -o, --output FILE   Save the result to FILE instead of displaying it"
      echo "  -h, --help          Show this help message"
      exit 0
      ;;
    *)
      if [ -z "$output_path" ]; then
        output_path="$1"
      else
        echo "Error: Unexpected argument '$1'"
        echo "Usage: $0 <output_path> [-o output_file]"
        exit 1
      fi
      shift
      ;;
  esac
done

if [ -z "$output_path" ]; then
    echo "Error: Missing output_path argument"
    echo "Usage: $0 <output_path> [-o output_file]"
    exit 1
fi

echo "[POLL] Starting to poll for results with outputPath: $output_path"
echo "[POLL] Using QUERY API endpoint: ${MODAL_QUERY_API}"

if [ -z "${MODAL_QUERY_API}" ]; then
  echo "Error: MODAL_QUERY_API environment variable is not set"
  exit 1
fi

# Initialize counters
retry_count=0
progress_percentage=0

# Start polling loop
while [ $retry_count -lt $MAX_RETRIES ]; do
  # Calculate and log progress percentage
  progress_percentage=$((retry_count * 100 / MAX_RETRIES))
  echo "[POLL] Progress: ${progress_percentage}% (Attempt $((retry_count + 1))/$MAX_RETRIES)"
  
  # Make the API request to check status
  response=$(curl -s --location "${MODAL_QUERY_API}" \
      --header 'Content-Type: application/json' \
      --data "{\"output_path\":\"${output_path}\"}")
  
  http_status=$?
  
  # Check if curl command was successful
  if [ $http_status -ne 0 ]; then
    echo "[POLL] Network error (curl exit code: $http_status), retrying..."
    retry_count=$((retry_count + 1))
    sleep $POLLING_INTERVAL
    continue
  fi
  
  # Check if response is JSON (contains a status field)
  if echo "$response" | grep -q '"status"'; then
    # Parse status from JSON response
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | sed 's/"status":"//;s/"//')
    
    if [ "$status" = "processing" ] || [ "$status" = "pending" ]; then
      # Still processing, wait and retry
      echo "[POLL] Task still $status, waiting before next poll..."
      retry_count=$((retry_count + 1))
      sleep $POLLING_INTERVAL
      continue
    elif [ "$status" = "completed" ]; then
      # Task completed with a JSON response containing output_url
      echo "[POLL] Task completed successfully with status: $status"
      
      # Extract output_url if available
      output_url=$(echo "$response" | grep -o '"output_url":"[^"]*"' | sed 's/"output_url":"//;s/"//')
      if [ -n "$output_url" ]; then
        echo "[POLL] Output URL: $output_url"
        
        # If output file is specified, download the result
        if [ -n "$OUTPUT_FILE" ]; then
          echo "[DOWNLOAD] Downloading result to $OUTPUT_FILE"
          curl -s -o "$OUTPUT_FILE" "$output_url"
          
          if [ $? -eq 0 ]; then
            echo "[DOWNLOAD] Download completed successfully: $OUTPUT_FILE"
            echo "Result saved to: $(realpath "$OUTPUT_FILE")"
            exit 0
          else
            echo "[DOWNLOAD ERROR] Failed to download result"
            exit 1
          fi
        else
          # Just display the completion info and output_url
          echo "[SUCCESS] Task completed. Use this output_url with t3-download.sh:"
          echo "$output_url"
          exit 0
        fi
      else
        # Just show the full response if no output_url found
        echo "[SUCCESS] Task completed. Full response:"
        echo "$response"
        exit 0
      fi
    elif [ "$status" = "failed" ]; then
      # Task failed with an error
      error=$(echo "$response" | grep -o '"error":"[^"]*"' | sed 's/"error":"//;s/"//')
      echo "[POLL ERROR] Task failed: ${error:-Unknown processing error}"
      exit 1
    else
      # Unknown status
      echo "[POLL WARNING] Unknown task status: $status"
      retry_count=$((retry_count + 1))
      sleep $POLLING_INTERVAL
      continue
    fi
  else
    # Check if response is a binary file
    content_type=$(file -b --mime-type <(echo "$response" | head -c 1024))
    
    if [[ "$content_type" == *"video/"* ]] || [[ "$content_type" == *"image/"* ]]; then
      echo "[POLL] Received binary data response - file is ready"
      
      # If output file is specified, save the result
      if [ -n "$OUTPUT_FILE" ]; then
        echo "$response" > "$OUTPUT_FILE"
        echo "[DOWNLOAD] File saved to: $(realpath "$OUTPUT_FILE")"
        exit 0
      else
        # If no output file specified, suggest using t3-download.sh
        echo "[SUCCESS] Received binary data. Use t3-download.sh with this output_path to save:"
        echo "$output_path"
        exit 0
      fi
    else
      # Not JSON status and not binary data - try again
      echo "[POLL] Received unexpected response format, retrying..."
      retry_count=$((retry_count + 1))
      sleep $POLLING_INTERVAL
      continue
    fi
  fi
done

# If we've reached maximum retries
echo "[POLL ERROR] Maximum retries ($MAX_RETRIES) reached without success"
echo "Task timed out after $((MAX_RETRIES * POLLING_INTERVAL)) seconds"
exit 1
