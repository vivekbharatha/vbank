#!/usr/bin/env bash

# Exit on error
set -e

# Print each command before executing
# set -x

# Store the root directory
ROOT_DIR="$(pwd)"
PACKAGES_DIR="$ROOT_DIR/packages"

# Check if npm is installed
if ! command -v npm &>/dev/null; then
  echo "Error: npm is not installed"
  exit 1
fi

# Function to build a package
build_package() {
  local package_name=$1
  echo "Building package: $package_name"
  npm install --prefix "$PACKAGES_DIR/$package_name"
  npm run build --prefix "$PACKAGES_DIR/$package_name"
}

echo "=====Starting Build Process====="

# Build core packages
build_package "logger"
build_package "redis-client"
build_package "constants"
build_package "kafka-client"

echo "=====Build Process Completed Successfully====="
