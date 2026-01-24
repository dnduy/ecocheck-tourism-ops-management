# EcoCheck Smoke Tests

Node.js automated smoke tests for validation of the core API workflow.

## 1. Prerequisites
- Node.js & NPM
- Running Backend (Local or Docker)

## 2. Setup
Install dependencies:
```bash
cd scripts/smoke
npm install
```

## 3. Configuration
Set environment variables or create a `.env` file in `scripts/smoke/.env`:
```ini
API_BASE_URL=http://localhost:8000/api
TEST_EMAIL=admin@local.test
TEST_PASSWORD=ChangeMe123!
# Optional:
# TEST_EMAIL_SUP=supervisor@local.test
# TEST_PASSWORD_SUP=password
```

## 4. Running the Test

### Local
```bash
node smoke.test.js
```

### Docker
To run this *against* the Docker containers from your host:
```bash
# Ensure containers are up
docker-compose up -d

# Run
node smoke.test.js
```
