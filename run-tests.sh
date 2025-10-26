#!/usr/bin/env bash
set -euo pipefail

# Run the three test files with Playwright (reporter: list)
npx playwright test tests/navigation.spec.ts tests/login.spec.ts tests/reservation.spec.ts --reporter=list
