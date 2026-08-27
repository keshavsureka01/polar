# POLAR-E Predictive Energy Intelligence

A Next.js control room for live global weather-driven energy dispatch, alert automation, secure hardware-gateway commands, and polar microgrid what-if analysis.

## Features

- Open-Meteo Best Match weather models for searched places and polar stations, refreshed every 60 seconds.
- Open-Meteo forward geocoding plus consent-based BigDataCloud reverse geocoding for browser GPS.
- Weather-dependent demand, renewable generation, generator dispatch, battery reserve, and fuel-endurance telemetry.
- User-defined alert rules evaluated by same-origin backend APIs.
- Demo command simulation and real HTTPS gateway delivery for REST, MQTT bridge, and Modbus gateway providers.
- FastAPI digital twin with normal, extreme-cold, wind-icing, and generator-failure scenarios.
- Same-origin Next.js simulation fallback when a separate FastAPI deployment is not configured.
- Search metadata, canonical URL, structured data, robots, and sitemap routes.

Open-Meteo values are live model estimates, not on-site sensor observations. Physical device control requires a customer-operated HTTPS gateway; private LAN addresses are not reachable from a public deployment.

## Local development

```bash
npm install
npm run dev
```

To run the optional FastAPI engine:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --port 8000
```

Set `POLAR_BACKEND_URL` on the Next.js server to the hosted FastAPI origin in production. Set `NEXT_PUBLIC_SITE_URL` to the public canonical site URL.

## Scripts

- `npm run dev` starts the Next.js development server.
- `npm run build` verifies the production build.
- `npm run typecheck` runs TypeScript checks.
- `npm run backtest` verifies energy balance, battery reserve, fuel behavior, and scenario deltas.
- `npm test` runs TypeScript and backend backtests.
- `npm run simulate` prints a synthetic dispatch table from `scripts/polar_dispatch.py`.
