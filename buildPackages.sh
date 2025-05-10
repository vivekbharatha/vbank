#!/usr/bin/env bash

# Exit on error
set -e

# Print each command before executing
# set -x

# Store the root directory
ROOT_DIR="$(pwd)"
PACKAGES_DIR="$ROOT_DIR/packages"
SERVICES_DIR="$ROOT_DIR/services"

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

# Install dependencies in each service
echo "=====Installing Dependencies in Services====="

# Function to install dependencies for a service
install_service_deps() {
  local service_name=$1
  echo "Installing dependencies for service: $service_name"
  npm i --prefix "$SERVICES_DIR/$service_name"
}

# Get list of service directories
if [ -d "$SERVICES_DIR" ]; then
  for service in "$SERVICES_DIR"/*; do
    if [ -d "$service" ]; then
      service_name=$(basename "$service")
      install_service_deps "$service_name"
    fi
  done
  echo "=====Service Dependencies Installation Completed====="
else
  echo "Services directory not found at $SERVICES_DIR"
fi