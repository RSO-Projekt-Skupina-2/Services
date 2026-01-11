# MicroHub Backend Services

Microservices backend for the MicroHub social media platform.

Link to frontend repository: https://github.com/RSO-Projekt-Skupina-2/MicroHub

## Architecture

This is a microservices architecture built with Node.js, TypeScript, Express.js, and PostgreSQL. Services communicate via HTTP/REST and share a PostgreSQL database.

## Quick Start

```bash
# Start all services and database
docker-compose up --build

# Services available at:
# http://localhost:3000 (Posts)
# http://localhost:3001 (Likes)
# http://localhost:3002 (Users)
# http://localhost:3003 (Comments)
# http://localhost:3004 (Profile)
# http://localhost:3005 (Moderation)
```

### Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| **Users** | 3002 | Authentication, user management, JWT tokens |
| **Posts** | 3000 | Post creation, retrieval, topic filtering |
| **Comments** | 3003 | Comment management, moderation |
| **Likes** | 3001 | Like/unlike posts, like counts |
| **Profile** | 3004 | User profile aggregation, statistics |
| **Moderation** | 3005 | Content moderation using OpenAI |

### Service Dependencies

```
Users Service (auth) ← Posts, Comments, Likes, Profile
Moderation Service ← Posts, Comments
Posts Service → Users, Moderation
Comments Service → Users, Moderation
Likes Service → Users
Profile Service → Users, Posts, Comments, Likes
```

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - HTTP framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Relational database
- **Sequelize** - ORM
- **prom-client** - Prometheus metrics
- **Swagger UI** - API documentation
- **Docker & Docker Compose** - Containerization



## Environment Variables

All configuration is in `docker-compose.yml`. Only one `.env` file is needed:

**Create `Services/.env`:**
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

All other variables are configured in docker-compose.yml:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing secret (change in production!)
- `USERS_SERVICE_URL`, `POSTS_SERVICE_URL`, etc. - Service discovery URLs

## Database Schema

Shared PostgreSQL database with the following tables:

```sql
users (id, username, email, password_hash, created_at)
posts (id, title, text, author_id, created_at)
post_topics (post_id, topic)
comments (id, post_id, user_id, text, created_at)
likes (id, post_id, user_id, created_at)
```

Database is automatically initialized by Sequelize models on first run.

## Authentication

### JWT Token Flow

1. **Register/Login**: User receives JWT token from `/users/login`
2. **Token Format**: `Authorization: Bearer {token}`
3. **Verification**:
   - Users service verifies tokens directly (local JWT verification)
   - Other services call `POST /users/verify` to validate tokens
4. **Expiration**: 24 hours (configurable via `JWT_EXPIRES_IN`)


## API Documentation

Each service provides Swagger UI documentation:

- Users: http://localhost:3002/api-docs
- Posts: http://localhost:3000/api-docs
- Comments: http://localhost:3003/api-docs
- Likes: http://localhost:3001/api-docs
- Profile: http://localhost:3004/api-docs
- Moderation: http://localhost:3005/api-docs

## Service Details

### Users Service (Port 3002)

**Authentication and user management**

**Routes:**
- `POST /users/register` - Register new user
- `POST /users/login` - Login and receive JWT token
- `POST /users/verify` - Verify JWT token (internal)
- `GET /users/me` - Get current user (requires auth)

**Dependencies:** PostgreSQL

---

### Posts Service (Port 3000)

**Post creation and management**

**Routes:**
- `GET /posts` - List all posts (optional `?topic=` filter)
- `POST /posts` - Create post (requires auth)
- `GET /posts/{id}` - Get specific post
- `DELETE /posts/{id}` - Delete post (requires auth)

**Dependencies:** PostgreSQL, Users Service, Moderation Service

---

### Comments Service (Port 3003)

**Comment management**

**Routes:**
- `GET /comments/post/{postId}` - Get comments for post
- `POST /comments` - Create comment (requires auth)
- `DELETE /comments/{id}` - Delete comment (requires auth)

**Dependencies:** PostgreSQL, Users Service, Moderation Service

---

### Likes Service (Port 3001)

**Like/unlike functionality**

**Routes:**
- `GET /likes/post/{postId}/status` - Get like count and user's like status (requires auth)
- `POST /likes` - Like a post (requires auth)
- `DELETE /likes/{postId}` - Unlike a post (requires auth)

**Dependencies:** PostgreSQL, Users Service

---

### Profile Service (Port 3004)

**User profile aggregation**

**Routes:**
- `GET /profile/me` - Get profile summary with aggregated stats (requires auth)

**Dependencies:** Users, Posts, Comments, Likes services

---

### Moderation Service (Port 3005)

**Content moderation using OpenAI**

**Routes:**
- `POST /moderation/check` - Check content for inappropriate material

**Dependencies:** OpenAI API

## Monitoring

Each service exposes Prometheus metrics at `/metrics`:

```bash
curl http://localhost:3000/metrics
```

**Metrics include:**
- HTTP request duration (by method, route, status code)
- Node.js process metrics (CPU, memory, heap)
- Event loop lag

## Health Checks

All microservices expose health check endpoints for Kubernetes monitoring:

### Endpoints

**`GET /health`** - Liveness probe
- Returns HTTP 200 if service is running
- Kubernetes restarts pod if this fails repeatedly

**`GET /ready`** - Readiness probe  
- Returns HTTP 200 if service is ready to handle requests
- Returns HTTP 503 if service is not ready (e.g., database disconnected)
- Kubernetes stops routing traffic to pod if this fails

## Development

### Project Structure

```
Services/
├── docker-compose.yml        # Orchestration
├── .env                      # OpenAI API key only
├── postgres/                 # Kubernetes configs
├── users/
│   ├── src/
│   │   ├── index.ts
│   │   ├── usersController.ts
│   │   ├── usersService.ts
│   │   ├── usersModels.ts
│   │   └── db/
│   ├── Dockerfile
│   ├── deployment.yaml       # Kubernetes
│   └── package.json
├── posts/                    # Similar structure
├── comments/                 # Similar structure
├── likes/                    # Similar structure
├── profile/                  # Similar structure
└── moderation/               # Similar structure
```

### Running Individual Services

```bash
cd Services/users # Or some other service
npm install
npm run dev  
```

**Note:** Requires PostgreSQL running and proper environment variables.

## Deployment

This section explains how to deploy the MicroHub backend services using Docker, Azure Container Registry (ACR), and Azure Kubernetes Service (AKS).

### Prerequisites

- Azure account with AKS cluster provisioned
- Azure Container Registry (ACR) set up
- `kubectl` installed and configured
- `docker` installed and configured
- GitHub repository with secrets configured (see **CI/CD Pipeline** section)

---

### Docker Build

Each service has its own Dockerfile. Build all services locally or via CI/CD:

```bash
# Navigate to service directory (example: Users)
cd Services/users

# Build Docker image
docker build -t users-service:latest .

# Tag for ACR
docker tag users-service:latest <ACR_LOGIN_SERVER>/users-service:latest

# Push to ACR
docker push <ACR_LOGIN_SERVER>/users-service:latest

Repeat for other services: `posts`, `comments`, `likes`, `profile`, `moderation`.

---

### Kubernetes Deployment

1. Apply service-specific deployments:

```bash
kubectl apply -f users/deployment.yaml
kubectl apply -f posts/deployment.yaml
kubectl apply -f comments/deployment.yaml
kubectl apply -f likes/deployment.yaml
kubectl apply -f profile/deployment.yaml
kubectl apply -f moderation/deployment.yaml
```

* Each Deployment specifies replicas, container image, ports, and environment variables.
* Health (`/health`) and readiness (`/ready`) endpoints are configured for Kubernetes probes.

2. Create corresponding Services:

```bash
kubectl apply -f users/service.yaml
kubectl apply -f posts/service.yaml
kubectl apply -f comments/service.yaml
kubectl apply -f likes/service.yaml
kubectl apply -f profile/service.yaml
kubectl apply -f moderation/service.yaml
```

* Each Service is typically `ClusterIP` type to expose pods within the cluster.
* Port numbers correspond to each microservice (3000–3005).

3. Apply Ingress:

```bash
kubectl apply -f ingress.yaml
```

* Routes HTTP traffic from `/posts`, `/users`, `/comments`, `/likes`, `/profile`, `/moderation` to the correct services.
* Ensure the catch-all route `/` is used by the frontend service to avoid conflicts.

---

### Verifying Deployment

* Check pods, services, and ingress:

```bash
kubectl get pods -n ingress
kubectl get svc -n ingress
kubectl get ingress -n ingress
```

* Access services via Ingress external IP:

```
http://<INGRESS_URL>/users
http://<INGRESS_URL>/posts
...
```

---

### Updating Deployment

* Update Docker image:

```bash
docker build -t <ACR_LOGIN_SERVER>/users-service:<TAG> .
docker push <ACR_LOGIN_SERVER>/users-service:<TAG>
```

* Update Kubernetes Deployment:

```bash
kubectl set image deployment/users-service users-service=<ACR_LOGIN_SERVER>/users-service:<TAG> -n ingress
kubectl rollout status deployment/users-service -n ingress
```

* Verify rollout:

```bash
kubectl get pods -n ingress
```

---

### Scaling Services

* Adjust replicas in deployment.yaml or scale directly:

```bash
kubectl scale deployment/users-service --replicas=3 -n ingress
```

* Recommended to scale database-backed services carefully to avoid connection pool limits.

---

### Environment Variables in Kubernetes

All services require environment variables configured in `deployment.yaml`:

* `DATABASE_URL` – PostgreSQL connection string
* `JWT_SECRET` – Secret for signing JWTs
* `OPENAI_API_KEY` – OpenAI key for Moderation service (should be stored as Kubernetes secret)
* Service URLs (`USERS_SERVICE_URL`, `POSTS_SERVICE_URL`, etc.)

---

### Notes

* All services expose `/health` and `/ready` endpoints for Kubernetes monitoring.
* Prometheus metrics are exposed at `/metrics` for monitoring and alerting.
* Make sure the backend services are deployed before the frontend to avoid API errors.


## CI/CD Pipeline

GitHub Actions automatically builds and deploys to Azure Kubernetes Service (AKS) on every push to main.

### Required Secrets
Set these in GitHub repository settings - Secrets:
- `ACR_LOGIN_SERVER` - Azure Container Registry URL
- `ACR_USERNAME` - ACR username
- `ACR_PASSWORD` - ACR password
- `KUBECONFIG_DATA` - Base64 encoded kubeconfig

