"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  generateForecast,
  getAssetStatuses,
  optimizeDispatch,
  Scenario,
  summarizeDispatch
} from "@/lib/simulation";

const initialScenario: Scenario = {
  blizzard: false,
  generatorFailure: false,
  initialSoc: 74,
  loadBias: 0,
  reserveTarget: 28
};

const stateStyles = {
  online: "border-emerald-200 bg-emerald-50 text-emerald-700",
  watch: "border-amber-200 bg-amber-50 text-amber-700",
  degraded: "border-red-200 bg-red-50 text-red-700",
  charging: "border-sky-200 bg-sky-50 text-sky-700"
};

function formatKw(value: number) {
  return `${Math.round(value)} kW`;
}

function tooltipKw(value: unknown) {
  return typeof value === "number" ? `${Math.round(value)} kW` : `${value}`;
}

function tooltipAbsKw(value: unknown) {
  return typeof value === "number" ? `${Math.abs(Math.round(value))} kW` : `${value}`;
}

export default function Home() {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [liveHour, setLiveHour] = useState(8);

  const forecast = useMemo(() => generateForecast(scenario), [scenario]);
  const dispatch = useMemo(() => optimizeDispatch(forecast, scenario), [forecast, scenario]);
  const summary = useMemo(() => summarizeDispatch(dispatch), [dispatch]);
  const statuses = useMemo(() => getAssetStatuses(dispatch, scenario, liveHour), [dispatch, scenario, liveHour]);
  const live = dispatch[liveHour];

  const setScenarioValue = <K extends keyof Scenario>(key: K, value: Scenario[K]) => {
    setScenario((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="min-h-screen px-4 py-5 text-polar-ink sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="grid gap-4 rounded-lg border border-white/80 bg-white/85 p-5 shadow-panel backdrop-blur md:grid-cols-[1.4fr_0.6fr] md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">POLAR-E Control Room</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Smart energy management for polar microgrids
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Synthetic weather feeds drive 24 hour renewable forecasts, battery decisions, and diesel dispatch priorities for a remote station.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Live Hour</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{live.hour}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Critical Load</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{formatKw(live.criticalLoadKw)}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statuses.map((asset) => (
                <article key={asset.name} className="rounded-lg border border-white bg-white p-4 shadow-panel">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{asset.name}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">{asset.value}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${stateStyles[asset.state]}`}>
                      {asset.state}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{asset.detail}</p>
                </article>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-lg border border-white bg-white p-4 shadow-panel">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Demand and Renewable Forecast</h2>
                    <p className="text-sm text-slate-500">24 hour synthetic station weather and load model.</p>
                  </div>
                  <select
                    aria-label="Select live hour"
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    value={liveHour}
                    onChange={(event) => setLiveHour(Number(event.target.value))}
                  >
                    {dispatch.map((point, index) => (
                      <option key={point.hour} value={index}>
                        {point.hour}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" interval={3} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={tooltipKw} />
                      <Area type="monotone" dataKey="demandKw" name="Demand" stroke="#475467" fill="#cbd5e1" fillOpacity={0.58} />
                      <Area type="monotone" dataKey="renewableKw" name="Renewable" stroke="#12b76a" fill="#bbf7d0" fillOpacity={0.7} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-lg border border-white bg-white p-4 shadow-panel">
                <h2 className="text-lg font-semibold text-slate-950">Optimization Engine Mock</h2>
                <p className="text-sm text-slate-500">Constraint heuristic: critical load first, preserve reserve, then reduce fuel.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric label="Renewable Share" value={`${summary.renewableShare}%`} />
                  <Metric label="Fuel Burn" value={`${summary.fuelLiters} L`} />
                  <Metric label="Final SOC" value={`${summary.finalSoc}%`} />
                  <Metric label="Unserved Critical" value={`${summary.unmetCriticalKwh} kWh`} danger={summary.unmetCriticalKwh > 0} />
                </div>
                <div className="mt-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dispatch} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" interval={5} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={tooltipAbsKw} />
                      <Bar dataKey="dieselKw" name="Diesel" stackId="dispatch" fill="#f79009" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="batteryKw" name="Battery" stackId="dispatch" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <section className="rounded-lg border border-white bg-white p-4 shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Battery State and Dispatch Plan</h2>
                  <p className="text-sm text-slate-500">Positive battery power discharges to load; negative values charge from surplus renewables.</p>
                </div>
                <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                  Reserve target {scenario.reserveTarget}%
                </span>
              </div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dispatch} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" interval={3} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="dieselKw" name="Diesel kW" stroke="#f79009" strokeWidth={2} dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="batteryKw" name="Battery kW" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="soc" name="SOC %" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <aside className="grid gap-4">
            <section className="rounded-lg border border-white bg-white p-4 shadow-panel">
              <h2 className="text-lg font-semibold text-slate-950">What-If Simulator</h2>
              <p className="text-sm text-slate-500">Toggle polar risk events and tune operating constraints.</p>
              <div className="mt-4 grid gap-3">
                <Toggle
                  label="Blizzard mode"
                  description="Icing, low irradiance, higher thermal demand"
                  checked={scenario.blizzard}
                  onChange={(checked) => setScenarioValue("blizzard", checked)}
                />
                <Toggle
                  label="Generator failure"
                  description="One diesel unit unavailable"
                  checked={scenario.generatorFailure}
                  onChange={(checked) => setScenarioValue("generatorFailure", checked)}
                />
                <Slider
                  label="Initial battery SOC"
                  value={scenario.initialSoc}
                  min={10}
                  max={100}
                  unit="%"
                  onChange={(value) => setScenarioValue("initialSoc", value)}
                />
                <Slider
                  label="Load bias"
                  value={scenario.loadBias}
                  min={-20}
                  max={30}
                  unit="%"
                  onChange={(value) => setScenarioValue("loadBias", value)}
                />
                <Slider
                  label="Reserve target"
                  value={scenario.reserveTarget}
                  min={10}
                  max={55}
                  unit="%"
                  onChange={(value) => setScenarioValue("reserveTarget", value)}
                />
              </div>
            </section>

            <section className="rounded-lg border border-white bg-white p-4 shadow-panel">
              <h2 className="text-lg font-semibold text-slate-950">Live Dispatch Snapshot</h2>
              <div className="mt-4 grid gap-3">
                <Readout label="Renewables" value={formatKw(live.renewableKw)} />
                <Readout label="Diesel" value={formatKw(live.dieselKw)} />
                <Readout label="Battery" value={`${live.batteryKw < 0 ? "Charging" : "Discharging"} ${Math.abs(live.batteryKw)} kW`} />
                <Readout label="Curtailment" value={formatKw(live.curtailedKw)} />
                <Readout label="Fuel this hour" value={`${live.fuelLiters} L`} />
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${danger ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${danger ? "text-red-700" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <input
        className="h-5 w-5 accent-sky-700"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
        {label}
        <span className="text-slate-600">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        className="accent-sky-700"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}
