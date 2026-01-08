# Laravel Backend for EcoCheck

This folder contains drop-in Laravel code to back the EcoCheck React app. Use Laravel 11 + Sanctum + MySQL.

## Quick start
1) Create project: `laravel new backend && cd backend`
2) Install Sanctum + CORS: `composer require laravel/sanctum fruitcake/laravel-cors`
3) Copy files from this `backend/` folder into the new project, preserving paths.
4) Set `.env`:
```
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:5173
DB_DATABASE=ecocheck
DB_USERNAME=root
DB_PASSWORD=secret
```
5) Publish Sanctum config (if not present): `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`
6) Migrate & seed: `php artisan migrate --seed`
7) Serve: `php artisan serve`

Default admin: `admin@local.test` / `ChangeMe123!`

## API surface
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Areas CRUD: `GET/POST/PUT/DELETE /api/areas`
- Templates: `GET /api/templates/{id}`, `POST /api/templates`
- Runs: `GET /api/runs`, `POST /api/runs`, `GET /api/runs/{id}`, `PUT /api/runs/{id}`
- Entries: `PUT /api/entries` (upsert cell)
- Signoffs: `POST /api/signoffs`
- Incidents CRUD: `GET/POST/PUT/DELETE /api/incidents`

## Roles
`manager`, `supervisor`, `staff`, `maintenance`

## Notes
- All protected routes use `auth:sanctum`
- CORS must allow the frontend origin
- Tokens issued via Sanctum personal access tokens
