#!/bin/bash

# LifeSprint Deployment Script
# This script builds and deploys the LifeSprint application

# Exit on error
set -e

# Configuration
DEPLOY_ENV=${1:-production}
BUILD_DIR="./build"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REMOTE_USER="your_username"
REMOTE_HOST="your_server_hostname"
REMOTE_PATH="/var/www/lifesprint"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

# Function to print warning messages
print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to print error messages
print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
  print_error ".env file not found. Please create it before deploying."
  exit 1
fi

# Check if .env.production file exists for production deployment
if [ "$DEPLOY_ENV" = "production" ] && [ ! -f ".env.production" ]; then
  print_warning ".env.production file not found. Using default .env file."
  cp .env .env.production
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup current build if it exists
if [ -d "$BUILD_DIR" ]; then
  print_status "Backing up current build..."
  tar -czf "$BACKUP_DIR/build_$TIMESTAMP.tar.gz" "$BUILD_DIR"
  print_status "Backup created at $BACKUP_DIR/build_$TIMESTAMP.tar.gz"
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run tests
print_status "Running tests..."
npm test -- --passWithNoTests

# Build the application
print_status "Building application for $DEPLOY_ENV environment..."
if [ "$DEPLOY_ENV" = "production" ]; then
  # Use production environment variables
  cp .env.production .env
fi

npm run build

# Restore original .env if we're in production
if [ "$DEPLOY_ENV" = "production" ]; then
  git checkout -- .env
fi

# Copy server configuration files to build directory
print_status "Copying server configuration files..."
cp .htaccess "$BUILD_DIR/"
cp nginx.conf "$BUILD_DIR/"

# Create a deployment package
print_status "Creating deployment package..."
DEPLOY_PACKAGE="lifesprint_$DEPLOY_ENV_$TIMESTAMP.tar.gz"
tar -czf "$DEPLOY_PACKAGE" "$BUILD_DIR"
print_status "Deployment package created: $DEPLOY_PACKAGE"

# Deploy to server (uncomment and configure for your server)
if [ "$DEPLOY_ENV" = "production" ]; then
  read -p "Do you want to deploy to the production server? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deploying to production server..."
    
    # Create backup on the server
    ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH/backups && if [ -d $REMOTE_PATH/current ]; then tar -czf $REMOTE_PATH/backups/backup_$TIMESTAMP.tar.gz -C $REMOTE_PATH current; fi"
    
    # Upload the deployment package
    scp "$DEPLOY_PACKAGE" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
    
    # Extract the package and set up the new version
    ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_PATH && tar -xzf $DEPLOY_PACKAGE && rm -rf previous && if [ -d current ]; then mv current previous; fi && mv build current && rm $DEPLOY_PACKAGE"
    
    print_status "Deployment completed successfully!"
  else
    print_status "Deployment to production server skipped."
  fi
fi

print_status "Build process completed successfully!"
