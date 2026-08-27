# POLAR-E Smart Energy Management Prototype

A functional Next.js MVP for a polar microgrid control room. It combines synthetic weather inputs, 24 hour load and renewable forecasts, a battery/diesel dispatch optimizer mock, and an interactive what-if simulator.

## Features

- Station digital twin cards for wind, solar, diesel generators, and battery SOC.
- 24 hour demand and renewable forecasting charts.
- MILP-style constraint optimization mock that prioritizes critical loads, reserve SOC, and lower fuel use.
- Scenario controls for blizzard conditions, generator failure, starting SOC, load bias, and reserve target.
- Python CLI simulation script for dispatch experimentation.

## Scripts

- `npm run dev` starts the Next.js development server.
- `npm run build` verifies the production build.
- `npm run typecheck` runs TypeScript checks.
- `npm run simulate` prints a synthetic dispatch table from `scripts/polar_dispatch.py`.
