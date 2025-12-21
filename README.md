## Fitness App – Development Setup

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose
- MongoDB running locally or MongoDB Atlas connection string
- GitHub account
- Docker Hub account
- Render account (for backend)
- Vercel account (for frontend)

### Repository Structure
- `server`: Express + MongoDB (Mongoose) + JWT auth
- `frontend`: React (Vite) + TypeScript frontend
- `.github/workflows`: CI/CD pipeline configuration
- `docker-compose.yml`: Local Docker development setup
- `index.html`: GitHub Pages static site

## 📦 CI/CD Pipeline

This project includes a CI/CD pipeline with:
- ✅ Automated testing with coverage reports
- ✅ Build phase with dependency caching and artifacts
- ✅ SonarCloud code quality analysis
- ✅ Docker image building and pushing to Docker Hub
- ✅ GitHub Pages deployment
- ✅ Environment-based deployments (Development & Production)
- ✅ Manual approval for production deployments
- ✅ Automatic deployment to Render (backend) and Vercel (frontend)

### 🌍 Environments

The pipeline supports two environments:

#### Development (main branch)
- Automatic deployment after tests pass
- Docker images tagged with `dev`
- No manual approval required

#### Production (production branch)  
- Requires manual approval from designated reviewers
- Docker images tagged with `prod` and `latest`
- Quality Gate checks must pass

### 🚀 Quick Start

```bash
# Deploy to Development
git push origin main

# Deploy to Production (requires approval)
git checkout production
git merge main
git push origin production
```


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

### Frontend (frontend)
1) Create `.env` in `frontend` with:

```bash
VITE_API_BASE_URL=http://localhost:4000
```

2) Install and run:

```bash
cd frontend
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

## 🐳 Docker Deployment

### Local Development with Docker

```bash
# Build and start all services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

Access:
- Frontend: http://localhost:80
- Backend: http://localhost:3000
- MongoDB: mongodb://localhost:27017

### Production Docker Images

Images are automatically built and pushed to Docker Hub via GitHub Actions:
- `yourusername/fitness-app-frontend:latest`
- `yourusername/fitness-app-backend:latest`

## 🧪 Testing

### Run Tests Locally

```bash
# Frontend tests
cd frontend
npm install
npm run test
npm run test:coverage

# Backend tests  
cd server
npm install
npm test
```

## 📊 CI/CD Pipeline Stages

1. **Testing Phase**
   - Frontend unit tests with coverage
   - Backend unit tests with coverage
   - Static analysis (SonarCloud) and quality gate
   - Coverage reports uploaded as artifacts

2. **Build Phase**
   - Frontend build with dependency caching
   - Backend build with dependency caching
   - Build artifacts stored for deployment

3. **Docker Phase** (main/production branches only)
   - Build Docker images for frontend and backend
   - Push images to Docker Hub with proper tags
   - Layer caching for faster builds

4. **Deployment Phase** (main branch only)
   - Backend deployed to Render
   - Frontend deployed to Vercel
   - Automatic health checks

## 🔧 Environment Variables

See [.env.template](./.env.template) for required environment variables.

### Backend (.env in server/)
```bash
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/fitness_app
JWT_SECRET=your-secret-key-at-least-32-chars
CLIENT_ORIGIN=http://localhost:8080
```

### Frontend (.env in frontend/)
```bash
VITE_API_BASE_URL=http://localhost:4000
```
