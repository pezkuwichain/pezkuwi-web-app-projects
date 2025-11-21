#!/bin/bash

###############################################################################
# Web Frontend Test Runner
# Runs Jest unit tests and Cypress E2E tests for web application
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PezkuwiChain Web Frontend Test Suite                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Navigate to web directory
cd "$(dirname "$0")/../web"

# Function to run unit tests
run_unit_tests() {
  echo -e "${YELLOW}Running Unit Tests (Jest + React Testing Library)...${NC}"
  echo ""

  npm run test -- \
    --testPathPattern="tests/web/unit" \
    --coverage \
    --verbose

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Unit tests passed!${NC}"
  else
    echo -e "${RED}✗ Unit tests failed!${NC}"
    exit 1
  fi
}

# Function to run E2E tests
run_e2e_tests() {
  echo -e "${YELLOW}Running E2E Tests (Cypress)...${NC}"
  echo ""

  # Start dev server in background
  echo "Starting development server..."
  npm run dev > /dev/null 2>&1 &
  DEV_SERVER_PID=$!

  # Wait for server to be ready
  echo "Waiting for server to start..."
  sleep 5

  # Run Cypress tests
  npx cypress run --spec "../tests/web/e2e/cypress/**/*.cy.ts"

  CYPRESS_EXIT_CODE=$?

  # Kill dev server
  kill $DEV_SERVER_PID

  if [ $CYPRESS_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ E2E tests passed!${NC}"
  else
    echo -e "${RED}✗ E2E tests failed!${NC}"
    exit 1
  fi
}

# Function to run specific test suite
run_specific_suite() {
  echo -e "${YELLOW}Running specific test suite: $1${NC}"
  echo ""

  case $1 in
    citizenship)
      npm run test -- --testPathPattern="citizenship"
      ;;
    education)
      npm run test -- --testPathPattern="education"
      ;;
    governance)
      npm run test -- --testPathPattern="governance"
      ;;
    p2p)
      npm run test -- --testPathPattern="p2p"
      ;;
    rewards)
      npm run test -- --testPathPattern="rewards"
      ;;
    treasury)
      npm run test -- --testPathPattern="treasury"
      ;;
    *)
      echo -e "${RED}Unknown test suite: $1${NC}"
      echo "Available suites: citizenship, education, governance, p2p, rewards, treasury"
      exit 1
      ;;
  esac
}

# Parse command line arguments
if [ $# -eq 0 ]; then
  # No arguments: run all tests
  echo -e "${BLUE}Running all tests...${NC}"
  echo ""
  run_unit_tests
  echo ""
  run_e2e_tests
elif [ "$1" == "unit" ]; then
  run_unit_tests
elif [ "$1" == "e2e" ]; then
  run_e2e_tests
elif [ "$1" == "suite" ] && [ -n "$2" ]; then
  run_specific_suite "$2"
elif [ "$1" == "watch" ]; then
  echo -e "${YELLOW}Running tests in watch mode...${NC}"
  npm run test -- --watch
elif [ "$1" == "coverage" ]; then
  echo -e "${YELLOW}Running tests with coverage report...${NC}"
  npm run test -- --coverage --coverageReporters=html
  echo ""
  echo -e "${GREEN}Coverage report generated at: web/coverage/index.html${NC}"
else
  echo -e "${RED}Usage:${NC}"
  echo "  $0                    # Run all tests"
  echo "  $0 unit               # Run only unit tests"
  echo "  $0 e2e                # Run only E2E tests"
  echo "  $0 suite <name>       # Run specific test suite"
  echo "  $0 watch              # Run tests in watch mode"
  echo "  $0 coverage           # Run tests with coverage report"
  exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   All tests completed successfully! ✓                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
