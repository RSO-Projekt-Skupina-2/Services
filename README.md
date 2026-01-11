"# MicroHub Backend Services

Microservices backend for the MicroHub social media platform.

## Architecture

This is a microservices architecture built with Node.js, TypeScript, Express.js, and PostgreSQL. Services communicate via HTTP/REST and share a PostgreSQL database.

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
cd Services/users
npm install
npm run dev  
```

**Note:** Requires PostgreSQL running and proper environment variables.

### Docker Commands

```bash
# Build and start
docker-compose up --build

```

