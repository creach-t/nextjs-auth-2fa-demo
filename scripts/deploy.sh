#!/bin/bash

# Next.js Auth 2FA Demo - Deployment Script
# This script automates the deployment process

set -e

echo "🚀 Starting deployment for Next.js Auth 2FA Demo..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    log_info "Checking environment variables..."
    
    local required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "EMAIL_HOST"
        "EMAIL_USER"
        "EMAIL_PASS"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    log_info "All required environment variables are set ✓"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm ci --only=production
    log_info "Dependencies installed ✓"
}

# Generate Prisma client
generate_prisma() {
    log_info "Generating Prisma client..."
    npx prisma generate
    log_info "Prisma client generated ✓"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    npx prisma db push
    log_info "Database migrations completed ✓"
}

# Build the application
build_app() {
    log_info "Building application..."
    npm run build
    log_info "Application built ✓"
}

# Run health checks
health_check() {
    log_info "Running health checks..."
    
    # Wait for the application to start
    sleep 5
    
    # Check if the application is responding
    if curl -f -s "${NEXTAUTH_URL}/api/maintenance" > /dev/null; then
        log_info "Health check passed ✓"
    else
        log_error "Health check failed ✗"
        exit 1
    fi
}

# Cleanup old processes
cleanup() {
    log_info "Cleaning up..."
    
    # Kill any existing Node.js processes (be careful in production)
    if pgrep -f "node.*server.js" > /dev/null; then
        log_warning "Stopping existing Node.js processes..."
        pkill -f "node.*server.js" || true
        sleep 2
    fi
    
    log_info "Cleanup completed ✓"
}

# Start the application
start_app() {
    log_info "Starting application..."
    
    # Start with PM2 if available, otherwise use node
    if command -v pm2 &> /dev/null; then
        pm2 start ecosystem.config.js --env production
        log_info "Application started with PM2 ✓"
    else
        nohup npm start > /dev/null 2>&1 &
        log_info "Application started with Node.js ✓"
    fi
}

# Main deployment process
main() {
    log_info "=== Next.js Auth 2FA Demo Deployment ==="
    
    # Set production environment
    export NODE_ENV=production
    
    # Run deployment steps
    check_env_vars
    cleanup
    install_dependencies
    generate_prisma
    run_migrations
    build_app
    start_app
    health_check
    
    log_info "🎉 Deployment completed successfully!"
    log_info "Application is running at: ${NEXTAUTH_URL}"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    "build")
        check_env_vars
        install_dependencies
        generate_prisma
        build_app
        ;;
    *)
        echo "Usage: $0 {deploy|health|cleanup|build}"
        echo "  deploy  - Full deployment (default)"
        echo "  health  - Run health check only"
        echo "  cleanup - Cleanup processes only"
        echo "  build   - Build application only"
        exit 1
        ;;
esac