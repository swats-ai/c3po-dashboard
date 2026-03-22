# C3PO Monitor Dashboard

A retro terminal-style mission control dashboard built with Next.js for monitoring tasks, agents, and system performance.

## 🚀 Features

- **Mission Control Dashboard**: Real-time overview with KPIs and active task monitoring
- **Task Management**: Complete task listing with filters, search, and pagination
- **Project Overview**: Project cards with task metrics and status visualization  
- **Agent Performance**: Performance metrics and roster management
- **Escalation Management**: Critical task tracking with urgency levels
- **System Logs**: Real-time log monitoring with filtering

## 🎨 Design

- **Retro Terminal Aesthetic**: 80s console/terminal look with modern UI polish
- **Matrix-inspired**: OLED black background with terminal green accents
- **JetBrains Mono**: Monospace font throughout for authentic terminal feel
- **Glow Effects**: Subtle text shadows and pulsing animations
- **Status Semaphores**: Color-coded status dots for quick visual scanning

## 🛠 Tech Stack

- **Next.js 16**: React framework with app directory
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Modern icon library
- **Client-side rendering**: All data fetching in components

## 🔧 Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment configuration**:
   The dashboard connects to a FastAPI backend at `http://127.0.0.1:8080` by default.
   You can override this by setting `NEXT_PUBLIC_API_URL` in `.env.local`.

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## 🔐 Authentication

Simple token-based authentication:
- Enter your API token on first load
- Token is stored securely in browser localStorage
- All API requests include `Authorization: Bearer <token>` header

## 📡 API Integration

The dashboard expects these FastAPI endpoints:

- `GET /api/v1/health` - Health check
- `GET /api/v1/dashboard/summary` - KPI metrics
- `GET /api/v1/tasks` - Task listing with filters
- `GET /api/v1/tasks/{id}` - Task details
- `GET /api/v1/projects/summary` - Project metrics
- `GET /api/v1/agents/summary` - Agent performance
- `GET /api/v1/escalations` - Escalated tasks
- `GET /api/v1/logs/recent` - Recent log entries

All endpoints return data in the format:
```json
{
  "request_id": "uuid",
  "timestamp": "iso-date",
  "data": {...},
  "meta": {...},
  "error": null
}
```

## 🎯 Key Components

- **AuthGate**: Token authentication wrapper
- **Sidebar**: Navigation with system status
- **TopBar**: Live indicator and refresh controls
- **TaskRow**: Task display with status semaphore
- **StatusBadge**: Color-coded status indicators
- **KPICard**: Metric cards with glow effects
- **ActivityFeed**: Real-time activity timeline

## 🔄 Real-time Updates

- Auto-refresh every 10 seconds (configurable)
- Manual refresh trigger
- Live indicator shows connection status
- "Last updated" timestamp tracking

## 🎨 Color Scheme

- **Background**: #0a0a0a (OLED black)
- **Surface**: #111111 with #1a1a1a borders  
- **Terminal Green**: #00ff41 (primary accent)
- **Cyan**: #00d4ff (secondary accent)
- **Amber**: #ffb300 (warnings)
- **Red**: #ff3333 (errors)
- **Text**: #e0e0e0 / #888888

## 📱 Responsive Design

Desktop-first design optimized for operations dashboards:
- Minimum 1200px width recommended
- Mobile-friendly sidebar and navigation
- Scrollable tables for overflow content

## 🚀 Deployment

Build artifacts are static and can be deployed to any hosting platform:

```bash
npm run build
```

The `out/` directory contains the static site ready for deployment.

---

**Built for mission-critical operations monitoring** 🛰️