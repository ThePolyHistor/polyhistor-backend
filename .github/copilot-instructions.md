# Copilot Instructions — PolyHistor Backend

This repo is a TypeScript Express API with Socket.IO real‑time features and Prisma/PostgreSQL. Follow the existing layering and patterns to fit in cleanly and avoid regressions.

## Architecture at a glance
- HTTP: `src/app.ts` wires global middleware, rate limiting under `/api`, routes for `auth`, `users`, `groups`, 404 via `AppError`, then `errorHandler`.
- Server/runtime: `src/server.ts` creates the HTTP server, initializes Socket.IO with the Redis adapter, and starts listening. Redis must be reachable or the process exits.
- Real‑time: `src/services/socket.service.ts` authenticates sockets via JWT (handshake `auth.token`), auto‑joins `group:${groupId}` rooms, throttles location broadcasts, and emits/handles events. Event contracts live in `src/services/socket.types.ts`.
- Data: Prisma models in `prisma/schema.prisma` (composite keys for friendships and group memberships; enums for statuses/roles). Access via per‑module services.
- Auth: JWT via `src/middleware/auth.middleware.ts` adds `req.user` (typed in `src/@types/express/index.d.ts`). Email verification codes stored on `User`.
- Logging/config: `src/config/index.ts` reads env and sets crash‑on‑uncaught behavior; `src/utils/logger.ts` is the central logger.

## Project conventions (do this)
- Route → Validation → `validate` middleware → Controller → Service → Prisma.
  - Example: `src/api/users/users.routes.ts` uses `users.validation.ts`, then controller methods that call `users.service.ts`.
- Responses: Controllers return `successResponse(data)` from `src/utils/apiResponse.ts`. Create returns 201; deletes often 204.
- Errors: Throw `new AppError(message, statusCode)`; let `errorHandler` shape the response. Don’t `res.json` errors manually.
- Validation: Use `express-validator` with typed DTOs. Keep param/body/query validators in the feature’s `*.validation.ts`.
- Authz patterns:
  - Friendships: Always sort IDs before querying the composite key: `[userOneId, userTwoId] = [a, b].sort()` (see `users.service.ts`).
  - Groups: Check membership/admin via helpers before mutating (`checkGroupMembership`, `checkGroupAdmin` in `groups.service.ts`).
- Prisma usage: Use `select` to avoid leaking secrets (e.g., exclude `passwordHash`), transactions for multi‑step writes (see `createGroup`).

## Real‑time patterns
- Authenticate sockets with JWT: client connects using `io(url, { auth: { token } })` to satisfy `authenticateSocket`.
- Rooming: Users auto‑join all of their `group:${groupId}` rooms on connect. Broadcast to rooms, not `io.emit`.
- Locations throttling: Cache per group and emit `locations-update` at 2s intervals. If adding new high‑freq events, mirror this pattern.
- Add events by updating `socket.types.ts` first, then implement handlers in `SocketService.initialize`/methods and emit typed payloads.

## Environment & runtime
- Required envs (non‑null asserted in `config`): `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRES_IN`, `JWT_REFRESH_TOKEN_EXPIRES_IN`, `REDIS_HOST`, `REDIS_PORT`, `CORS_ORIGIN`.
- Email: `src/services/email.service.ts` currently uses Gmail SMTP credentials in code. Prefer wiring through env vars; do not commit secrets.

## Developer workflow
- Install/build/run: `npm install` → `npm run dev` (ts‑node‑dev) → `npm run build` (tsc) → `npm start` (dist/server.js).
- Prisma: `npm run prisma:migrate` to evolve schema; `npm run prisma:generate` if you change the schema without migrating.
- CORS: Honor `config.corsOrigin`. New routes should mount under `/api` and inherit the rate limiter at `/api`.

## Where to look for examples
- Auth flow: `src/api/auth/*` (registration + email verification + JWT login/refresh/logout, hashed refresh tokens).
- Users: `users.service.ts` shows composite key patterns and ID sorting; controllers demonstrate standard responses.
- Groups/Trips/Messages: `groups.*` shows membership/admin checks, pagination example for messages, and nested routing.

Keep changes small and aligned with these patterns; prefer adding new feature modules that mirror the existing route/controller/service/validation structure.
