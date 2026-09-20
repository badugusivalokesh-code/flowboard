# FlowBoard

FlowBoard is a full-stack project management dashboard. Authenticated users can manage projects and view live project status, revenue, activity, recent activity, and upcoming deadlines.

## Tech stack

- Frontend: React 18, TypeScript, Vite 5, React Router, Tailwind CSS, Recharts, lucide-react
- Backend: Node.js, Express, TypeScript, Mongoose, MongoDB, JWT cookies, bcryptjs, CORS, dotenv

## Project structure

```text
client/
  src/
    components/     Reusable UI, layout, dashboard, chart, project, and auth components
    context/        Authentication and theme providers
    hooks/          Authentication, data, drawer, media-query, and scroll hooks
    pages/          Landing, login, registration, dashboard, and projects pages
    services/       API, authentication, dashboard, and project clients
    types/          Frontend API and domain types
  public/
  App.tsx
  package.json
  vercel.json
server/
  src/
    config/         Environment validation and MongoDB connection
    controllers/    Authentication, dashboard, and project handlers
    middleware/     Authentication, error, and not-found middleware
    models/         User and Project Mongoose models
    routes/         API route registration
    scripts/        Demo data seed script
    services/       Authentication, dashboard, and project services
    utils/          API error, async handler, and JWT helpers
  package.json
.env.example       Combined environment reference
```

## Local setup

Requires Node.js 18 or newer and a MongoDB connection.

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` and set the values described below. In a second terminal:

```bash
cd client
npm install
```

Copy `client/.env.example` to `client/.env`. The default API URL targets the local server.

## Environment variables

### Server

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random secret used to sign auth cookies |
| `CLIENT_URL` | Yes | Exact frontend origin allowed by CORS |
| `JWT_EXPIRES_IN` | No | JWT lifetime; defaults to `7d` |
| `PORT` | No | HTTP port; defaults to `5000` |
| `NODE_ENV` | No | Set to `production` for deployed cookies |
| `MONGO_SRV_DNS_WORKAROUND` | No | Development-only opt-in for a Windows Atlas DNS issue |

Never commit `.env` files or real secrets. `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` are validated when the server starts.

### Client

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Backend API base URL, including `/api` |

The client has no production localhost fallback; Vite injects `VITE_API_URL` at build time.

## MongoDB setup

Use a local MongoDB instance with `mongodb://localhost:27017/flowboard`, or create a MongoDB Atlas cluster and use its `mongodb+srv://` connection string. For Atlas, create a database user and allow the deployed backend's network access. Do not expose database credentials in frontend variables.

## Development commands

Run these in separate terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

The API runs on `http://localhost:5000` and Vite serves the client on `http://localhost:5173` by default.

## Demo data

After configuring `server/.env`, install server dependencies and run:

```bash
cd server
npm run seed
```

The seed script creates or refreshes a demo user and sample projects. It supports `SEED_DEMO_EMAIL` and `SEED_DEMO_PASSWORD` as optional seed-only values. Do not use demo credentials in production.

## Production builds

```bash
cd client
npm run build
```

```bash
cd server
npm run build
npm start
```

The client build is written to `client/dist`. The server build is written to `server/dist`, and `npm start` runs `dist/server.js`.

## Deployment

### Frontend on Vercel

Create a Vercel project with `client` as the root directory and the Vite framework preset. Set:

```text
VITE_API_URL=https://<backend-domain>/api
```

`client/vercel.json` rewrites all paths to `/index.html` because the React app uses `BrowserRouter`. This keeps direct navigation and refreshes on `/dashboard` and `/dashboard/projects` working.

### Backend

Deploy `server` as a Node web service. Use:

- Build command: `npm install && npm run build`
- Start command: `npm start`

Set these production environment variables on the backend:

```text
MONGO_URI=<production MongoDB connection string>
JWT_SECRET=<long random production secret>
JWT_EXPIRES_IN=7d
NODE_ENV=production
CLIENT_URL=https://<vercel-domain>
PORT=<platform-provided port, when required>
```

The backend exposes `GET /health` and serves the API below `/api`. CORS uses the exact `CLIENT_URL`, and authentication cookies require HTTPS in production.

## API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET|POST /api/projects`
- `PATCH|DELETE /api/projects/:id`
- `GET /api/dashboard/summary`

## Additional scripts

- Client: `npm run typecheck`, `npm run preview`
- Server: `npm run typecheck`, `npm run seed`

No `.npmrc` is required. Both packages use their existing `package.json` scripts and standard npm behavior.
