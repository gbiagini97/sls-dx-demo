#!/bin/bash

# Script to help developers switch between iterations

# Define available iterations
ITERATIONS=(
  "iteration1/spike"
  "iteration2/testing"
  "iteration3/multi-account"
  "iteration4/express-step-function"
  "iteration5/stack-separation"
  "iteration6/auction-lifecycle"
  "main"
)

# Function to display usage
function show_usage {
  echo "Usage: ./scripts/switch-iteration.sh [iteration-number]"
  echo "Available iterations:"
  echo "  1: Initial Spike - Basic functionality with Lambda"
  echo "  2: Improved Testing - Gherkin-style tests and better error handling"
  echo "  3: Multi-Account Setup - Configuration for multi-account deployment"
  echo "  4: Express Step Function - Transaction handling for bid placement"
  echo "  5: Stack Separation - Split into StatefulStack and ServerlessStack"
  echo "  6: Auction Lifecycle - EventBridge Pipes and automatic status updates"
  echo "  main: Final state with all features"
  exit 1
}

# Check if an argument was provided
if [ $# -ne 1 ]; then
  show_usage
fi

# Check if the argument is a number between 1 and 6 or "main"
if [[ "$1" == "main" ]]; then
  BRANCH="main"
elif [[ "$1" =~ ^[1-6]$ ]]; then
  BRANCH="${ITERATIONS[$1-1]}"
else
  show_usage
fi

# Check if there are uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "Error: You have uncommitted changes. Please commit or stash them before switching iterations."
  exit 1
fi

# Switch to the requested branch
echo "Switching to $BRANCH..."
git checkout "$BRANCH"

if [ $? -eq 0 ]; then
  echo "Successfully switched to $BRANCH"
  echo "Running npm install to ensure dependencies are up to date..."
  npm install
  echo "Done! You can now run 'npm run deploy:dev -- --all' to deploy this iteration."
else
  echo "Failed to switch to $BRANCH"
  exit 1
fi
