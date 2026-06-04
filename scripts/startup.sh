#!/usr/bin/env bash
#
# ─── AetherStudio Startup Script ──────────────────────────────────
#   Orchestrates the full startup flow:
#     1. Check prerequisites (Docker, Node.js, npm)
#     2. Check environment file (.env — consolidated at project root)
#     3. Start Docker infrastructure (MongoDB, Redis)
#     4. Install backend + frontend dependencies
#     5. Start both services in dev mode concurrently
#
#   Graceful shutdown on Ctrl+C (trap handles cleanup)
#
#   Usage:
#     ./scripts/startup.sh            # Full startup (Docker + dev servers)
#     ./scripts/startup.sh --no-docker # Skip Docker, assume services running
#     ./scripts/startup.sh --help      # Show help
#
# ──────────────────────────────────────────────────────────────

set -euo pipefail  # strict mode
IFS=$'\n\t'

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# ── Help ─────────────────────────────────────────────────────
show_help() {
  cat <<EOF
${BOLD}AetherStudio Startup Script${NC}

  Orchestrates the full startup flow for AetherStudio development.

${BOLD}Usage:${NC}
  ./scripts/startup.sh              Full startup
  ./scripts/startup.sh --no-docker  Skip Docker services
  ./scripts/startup.sh --help       Show this help

${BOLD}What it does:${NC}
  1. Checks prerequisites (Docker, Node.js, npm)
  2. Starts Docker infrastructure (MongoDB, Redis)
  3. Waits for services to become healthy
  4. Installs backend + frontend dependencies
  5. Starts both servers in dev mode concurrently
  6. Cleans up gracefully on Ctrl+C
EOF
  exit 0
}

# ── Utility Functions ───────────────────────────────────────

log()     { echo -e "${DIM}[$(date +%H:%M:%S)]${NC} $1"; }
info()    { log "${BLUE}ℹ${NC}  $1"; }
success() { log "${GREEN}✔${NC}  $1"; }
warn()    { log "${YELLOW}⚠${NC}  $1"; }
error()   { log "${RED}✘${NC}  $1"; }
header()  { echo -e "\n${BOLD}${MAGENTA}═══ $1 ${NC}${DIM}${2:-}${NC}"; }
divider() { echo -e "${DIM}───────────────────────────────────────────────${NC}"; }

# ── Prerequisite Checks ─────────────────────────────────────

check_prerequisites() {
  header "PREREQUISITES"

  # Docker
  if command -v docker &>/dev/null; then
    success "Docker: $(docker --version 2>&1)"
    if docker info &>/dev/null; then
      success "Docker daemon: running"
    else
      error "Docker daemon is not running. Start Docker Desktop and try again."
      exit 1
    fi
  else
    error "Docker is not installed. Install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    exit 1
  fi

  # Node.js
  if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    success "Node.js: ${NODE_VER}"
    # Extract major version
    NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
      warn "Node.js 18+ is recommended (you have ${NODE_VER})"
    fi
  else
    error "Node.js is not installed. Install it from https://nodejs.org/"
    exit 1
  fi

  # npm
  if command -v npm &>/dev/null; then
    success "npm: $(npm --version)"
  else
    error "npm is not installed."
    exit 1
  fi

  # Docker Compose
  if docker compose version &>/dev/null; then
    success "Docker Compose: $(docker compose version 2>&1)"
  elif docker-compose --version &>/dev/null; then
    success "Docker Compose: $(docker-compose --version 2>&1)"
    warn "Using legacy 'docker-compose' command. Consider updating Docker Desktop."
  else
    error "Docker Compose not found. Install Docker Desktop which includes it."
    exit 1
  fi

  divider
}

# ── Docker Infrastructure ───────────────────────────────────

start_docker_services() {
  header "DOCKER INFRASTRUCTURE" "(MongoDB + Redis)"

  info "Starting MongoDB and Redis via Docker Compose..."
  if docker compose ps --services --filter "status=running" 2>/dev/null | grep -q .; then
    warn "Some containers are already running."
  fi

  # Start only the infra services (mongodb + redis), not backend/frontend
  docker compose up -d mongodb redis 2>&1 | while IFS= read -r line; do
    if echo "$line" | grep -qiE "(done|started|created|running)"; then
      success "${line}"
    else
      info "${line}"
    fi
  done

  divider

  header "WAITING FOR SERVICES" "(MongoDB + Redis)"

  info "Waiting for containers to be healthy (port check)..."

  # Wait for MongoDB (port check is more portable than exec)
  local MONGO_TIMEOUT=60
  local MONGO_ELAPSED=0
  while [ $MONGO_ELAPSED -lt $MONGO_TIMEOUT ]; do
    if docker compose ps --filter "name=mongodb" --format "{{.Status}}" 2>/dev/null | grep -qiE "(healthy|Up|running)"; then
      # Quick port-level check
      if docker compose exec -T mongodb mongosh --quiet --eval "db.runCommand({ping:1}).ok" 2>/dev/null | grep -q "1" 2>/dev/null; then
        success "MongoDB is ready"
        break
      fi
      # Fallback: just check if the container is up
      if docker compose port mongodb 27017 2>/dev/null; then
        success "MongoDB container is up (port 27017)"
        break
      fi
    fi
    sleep 2
    MONGO_ELAPSED=$((MONGO_ELAPSED + 2))
  done
  if [ $MONGO_ELAPSED -ge $MONGO_TIMEOUT ]; then
    warn "MongoDB did not respond within ${MONGO_TIMEOUT}s — continuing anyway"
  fi

  # Wait for Redis
  info "Waiting for Redis to be healthy..."
  local REDIS_TIMEOUT=30
  local REDIS_ELAPSED=0
  while [ $REDIS_ELAPSED -lt $REDIS_TIMEOUT ]; do
    if docker compose ps --filter "name=redis" --format "{{.Status}}" 2>/dev/null | grep -qiE "(healthy|Up|running)"; then
      if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG" 2>/dev/null; then
        success "Redis is ready"
        break
      fi
      if docker compose port redis 6379 2>/dev/null; then
        success "Redis container is up (port 6379)"
        break
      fi
    fi
    sleep 2
    REDIS_ELAPSED=$((REDIS_ELAPSED + 2))
  done
  if [ $REDIS_ELAPSED -ge $REDIS_TIMEOUT ]; then
    warn "Redis did not respond within ${REDIS_TIMEOUT}s — continuing anyway"
  fi

  divider
}

# ── Environment Check ──────────────────────────────────────

check_env_file() {
  if [ ! -f .env ]; then
    if [ -f backend/.env ]; then
      info "Migrating backend/.env → .env (consolidated root)..."
      cp backend/.env .env
      success ".env created from existing backend/.env"
    elif [ -f .env.example ]; then
      info "Copying .env.example → .env ..."
      cp .env.example .env
      warn "Using default .env — update JWT_SECRET and other secrets for production!"
    else
      error "No .env or .env.example found at project root."
      error "Create .env with at least:"
      error "  JWT_SECRET=your-secret-key-here"
      error "  MONGO_URI=mongodb://localhost:27017/aetherstudio"
      exit 1
    fi
  else
    success ".env exists at project root"
  fi

  # Legacy compat: also keep backend/.env in sync
  if [ -f .env ] && [ ! -f backend/.env ]; then
    cp .env backend/.env
    info "Also copied .env → backend/.env (legacy compat)"
  fi
}

# ── Dependency Installation ─────────────────────────────────

install_dependencies() {
  header "DEPENDENCIES"

  # Backend
  info "Installing backend dependencies..."
  (cd backend && npm install 2>&1 | tail -5)
  if [ "${PIPESTATUS[0]}" -eq 0 ]; then
    success "Backend dependencies installed"
  else
    error "Backend npm install failed"
    exit 1
  fi

  # Frontend
  info "Installing frontend dependencies..."
  (cd frontend && npm install 2>&1 | tail -5)
  if [ "${PIPESTATUS[0]}" -eq 0 ]; then
    success "Frontend dependencies installed"
  else
    error "Frontend npm install failed"
    exit 1
  fi

  divider
}

# ── Server Startup ──────────────────────────────────────────

start_dev_servers() {
  header "STARTING DEV SERVERS"

  info "Starting backend (port 5000) and frontend (port 5173)..."

  # Use the root workspace's dev script which already wires up
  # backend + frontend via the locally installed concurrently
  npm run dev
}

# ── Cleanup ──────────────────────────────────────────────────

cleanup() {
  echo ""
  header "CLEANUP"
  info "Shutting down dev servers..."

  # The concurrently --kill-others flag handles killing child processes.
  # This function runs if the script is terminated externally.

  if [ "${SKIP_DOCKER:-false}" != "true" ]; then
    warn "Docker services (MongoDB, Redis) are still running."
    info "Stop them with:  ${CYAN}docker compose down${NC}"
    info "Keep them running if you plan to restart:  ${CYAN}docker compose start${NC}"
  fi

  success "AetherStudio shut down gracefully."
  exit 0
}

# ── Main ────────────────────────────────────────────────────

main() {
  local SKIP_DOCKER=false

  # Parse arguments
  for arg in "$@"; do
    case "$arg" in
      --help|-h)
        show_help
        ;;
      --no-docker)
        SKIP_DOCKER=true
        ;;
      *)
        warn "Unknown argument: $arg"
        show_help
        ;;
    esac
  done

  # Show banner
  echo ""
  echo -e "  ${BOLD}${CYAN}  ██████╗ ███████╗██╗   ██╗███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗${NC}"
  echo -e "  ${BOLD}${CYAN}  ██╔══██╗██╔════╝██║   ██║████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝${NC}"
  echo -e "  ${BOLD}${CYAN}  ██║  ██║█████╗  ██║   ██║██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗${NC}"
  echo -e "  ${BOLD}${CYAN}  ██║  ██║██╔══╝  ╚██╗ ██╔╝██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║${NC}"
  echo -e "  ${BOLD}${CYAN}  ██████╔╝███████╗ ╚████╔╝ ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║${NC}"
  echo -e "  ${BOLD}${CYAN}  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝${NC}"
  echo -e "  ${DIM}  Production-ready collaborative IDE${NC}"
  echo ""

  # Trap Ctrl+C and other termination signals
  trap cleanup SIGINT SIGTERM

  # Step 1: Check prerequisites
  check_prerequisites

  # Step 2: Check environment file (fail fast before starting infrastructure)
  check_env_file

  # Step 3: Start Docker services (unless --no-docker)
  if [ "${SKIP_DOCKER}" != "true" ]; then
    start_docker_services
  else
    info "Skipping Docker services (--no-docker flag detected)"
    divider
  fi

  # Step 4: Install dependencies
  install_dependencies

  # Step 5: Start dev servers
  start_dev_servers
}

# Run main (only if script is executed directly, not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
