# PolyHistor Backend

This is the backend server for the Polyhistor application, a real-time location tracking social utility built with Node.js, Express, TypeScript, PostgreSQL, and Socket.IO.

## Features

- User Authentication (Register/Login with JWT)
- Friendship Management (Send, Accept, Block Requests)
- Group Creation and Management
- Real-time Chat within Groups via WebSockets
- Real-time Location Tracking during "Trips"
- Scalable WebSocket layer using a Redis Adapter

## Tech Stack

- **Framework**: Node.js with Express.js & TypeScript
- **Database**: PostgreSQL with PostGIS
- **ORM**: Prisma
- **Real-Time Engine**: Socket.IO
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: bcrypt

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- PostgreSQL + PostGIS extension
- Redis

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd geosocial-backend-ts
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

### 4. Setup the database

```bash
npx prisma migrate dev --name init
```

### 5. Run the server

- For development

```bash
npm run dev
```

- For production

```bash
npm run build
```

- Start the server

```bash
npm run start
```
