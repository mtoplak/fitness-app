Fitness App Server

Env variables required:
- PORT (default 4000)
- MONGODB_URI (e.g. mongodb://localhost:27017/fitness_app)
- JWT_SECRET (set a strong secret)
- CLIENT_ORIGIN (e.g. http://localhost:8080)

Scripts:
- dev: tsx watch src/index.ts
- build: tsc -p tsconfig.json
- start: node dist/index.js

Endpoints:
- POST /auth/register { email, password, fullName, role? }
- POST /auth/login { email, password }
- GET /user/me (Authorization: Bearer <token>)


