## Fitness App – Development Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally or a MongoDB Atlas connection string

### Repository Structure
- `server`: Express + MongoDB (Mongoose) + JWT auth
- `fitness-landing-page`: React (Vite) frontend

### Backend (server)
1) Create `.env` in `server` with:

```bash
PORT=4000
MONGODB_URI=mongodb://localhost:27017/fitness_app
JWT_SECRET=your-secret
CLIENT_ORIGIN=http://localhost:8080
```

2) Install and run:

```bash
cd server
npm install
npm run dev
```

Server will start on `http://localhost:4000`.

Endpoints:
- POST `/auth/register` { email, password, fullName, role? }
- POST `/auth/login` { email, password }
- GET `/user/me` (Authorization: Bearer <token>)

### Frontend (fitness-landing-page)
1) Create `.env` in `fitness-landing-page` with:

```bash
VITE_API_BASE_URL=http://localhost:4000
```

2) Install and run:

```bash
cd fitness-landing-page
npm install
npm run dev
```

Frontend will start on `http://localhost:8080`.

### Auth and Roles
- Supported roles: `admin`, `trainer`, `member`
- After login/registration you’ll be redirected to `/dashboard` which shows a role-based page

### Troubleshooting
- Ensure MongoDB is running and `MONGODB_URI` is correct
- CORS: `CLIENT_ORIGIN` must match the frontend origin

