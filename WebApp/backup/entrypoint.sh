#!/bin/bash

# Print the environment variables to the console for debugging
echo "Environment variables stored in /app/src/env.list"
# Store environment variables in a file
printenv > /app/src/env.list

# Start cron in the foreground
exec cron -f