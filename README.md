# PulseOps — API Monitoring & Service Health Analytics Platform

PulseOps is a complete full-stack internship prototype for synthetic API monitoring. It periodically checks registered HTTP endpoints, measures latency and status codes, classifies health, stores monitoring history, creates incidents, generates alerts, and presents everything in a polished React dashboard.

## Included features

- Professional responsive React dashboard
- JWT login with Admin and Developer roles
- Service registration and deletion
- Automatic background monitoring every 20 sec
- Manual health checks
- Health states: Healthy / Warning / Critical / Down
- Response-time and HTTP-status tracking
- Uptime, failure count and average latency calculations
- Historical service metrics and line charts
- Automatic incident creation and recovery resolution
- In-app alert center with unread/read states
- Search and status filtering
- CSV service report export
- Admin monitoring settings
- Demo controls to simulate Healthy, Warning, Critical and Down states
- Bundled mock APIs, so the entire project works without external services
- JSON persistence for zero-configuration local demo use

> The prototype uses a local JSON persistence layer so it runs immediately on any laptop. The storage layer can later be swapped for PostgreSQL without changing the overall project workflow.

## Requirements

- Node.js 20.19+ or 22.12+ (Node 24 LTS works well)
- npm

## First-time setup (Windows - easiest)

1. Extract the ZIP.
2. Double-click `SETUP.bat`.
3. Wait until both frontend and backend dependencies finish installing.

## Run PulseOps (Windows - easiest)

Double-click `START_PULSEOPS.bat`. It starts both servers and opens the browser automatically.

### Terminal alternative

First install dependencies:

```bash
npm --prefix backend install
npm --prefix frontend install
```

Then use two terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Then open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/health

## Demo login

Admin account:

- Email: `admin@pulseops.dev`
- Password: `admin123`

Developer account:

- Email: `dev@pulseops.dev`
- Password: `dev123`

Use the **Admin** account for the full demo because it can add/delete services, change monitoring settings, and use the incident simulation controls.

## Best presentation demo

1. Login with the Admin account.
2. Show the Overview dashboard and service metrics.
3. Open **Settings & Demo Controls**.
4. Change `payments` from Critical to Healthy and run monitoring.
5. Return to Overview and show the recovery alert and resolved incident.
6. Change `orders` to Down and run monitoring.
7. Show that an incident is automatically created and the dashboard status changes.
8. Open the Orders service page to show historical checks and latency data.
9. Export the CSV report.

## Project architecture

```text
React Dashboard
      |
      | REST + JWT
      v
Node.js / Express API
      |
      +---- Background Monitoring Worker
      |            |
      |            v
      |       Monitored HTTP APIs
      |
      +---- Persistence Layer
              |
              +-- Services
              +-- Monitoring checks
              +-- Incidents
              +-- Alerts
```

## Important prototype note

PulseOps is a lightweight internal monitoring platform for internship demonstration. It is not intended to replace enterprise observability systems such as Datadog, New Relic, Prometheus, or Grafana.
