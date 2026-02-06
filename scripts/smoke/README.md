# EcoCheck Smoke Tests

Automated smoke tests for validating the core API workflow.

## 1. Prerequisites
- Node.js & NPM
- Running Backend (Local or Docker)
- Co du lieu toi thieu: area + template + items + columns

## 2. Configuration
Set environment variables (or create a `.env` file and export before running):
```ini
API_BASE_URL=http://localhost:8000/api
TEST_EMAIL=admin@local.test
TEST_PASSWORD=ChangeMe123!
# Optional:
# TEST_EMAIL_SUP=supervisor@local.test
# TEST_PASSWORD_SUP=password
```

## 3. Running the Test

### Local
```bash
RUN_SMOKE_TESTS=true API_BASE_URL=http://localhost:8000/api npm run test:smoke
```

### Deep flow (role + multi-column entries)
```bash
RUN_DEEP_TESTS=true API_BASE_URL=http://localhost:8000/api npm run test:deep
```

### Seed data (optional, backend)
```bash
cd backend-app
php artisan db:seed --class=SmokeTestSeeder
```
