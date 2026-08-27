"use client";

import {
  AlertTriangle,
  BellPlus,
  CheckCircle2,
  CloudSun,
  Crosshair,
  Gauge,
  Globe2,
  LocateFixed,
  PlugZap,
  Power,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  SunMedium,
  Thermometer,
  Trash2,
  Wind
} from "lucide-react";
import { useState } from "react";
import type { AlertAction, AlertOperator, AlertRule, AutomationDecision, DeviceConfig, LiveWeather, LocationResult, WeatherMetric } from "@/types/live";

interface LiveOperationsPanelProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchResults: LocationResult[];
  selectedLocation: LocationResult;
  weather: LiveWeather | null;
  decision: AutomationDecision | null;
  alertRules: AlertRule[];
  deviceConfig: DeviceConfig;
  busy: boolean;
  deviceMessage: string;
  error: string;
  onSearch: () => void;
  onSelectLocation: (location: LocationResult) => void;
  onUseBrowserLocation: () => void;
  onRefresh: () => void;
  onAddRule: (rule: AlertRule) => void;
  onToggleRule: (ruleId: string) => void;
  onRemoveRule: (ruleId: string) => void;
  onDeviceConfigChange: (config: DeviceConfig) => void;
  onSendCommand: () => void;
}

const metricOptions: { value: WeatherMetric; label: string; unit: string }[] = [
  { value: "temperatureC", label: "Temperature", unit: "deg C" },
  { value: "apparentTemperatureC", label: "Feels Like", unit: "deg C" },
  { value: "windSpeedKmh", label: "Wind Speed", unit: "km/h" },
  { value: "precipitationProbability", label: "Rain Probability", unit: "%" },
  { value: "cloudCoverPercent", label: "Cloud Cover", unit: "%" },
  { value: "shortwaveRadiationWm2", label: "Solar Irradiance", unit: "W/m2" }
];

const actionOptions: { value: AlertAction; label: string }[] = [
  { value: "start_generator", label: "Start generator" },
  { value: "stop_generator", label: "Stop generator" },
  { value: "shed_noncritical", label: "Shed non-critical" },
  { value: "limit_solar", label: "Limit solar output" },
  { value: "raise_notice", label: "Raise notice" }
];

export function LiveOperationsPanel({
  query,
  onQueryChange,
  searchResults,
  selectedLocation,
  weather,
  decision,
  alertRules,
  deviceConfig,
  busy,
  deviceMessage,
  error,
  onSearch,
  onSelectLocation,
  onUseBrowserLocation,
  onRefresh,
  onAddRule,
  onToggleRule,
  onRemoveRule,
  onDeviceConfigChange,
  onSendCommand
}: LiveOperationsPanelProps) {
  return (
    <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
      <div className="grid min-w-0 gap-6">
        <LocationPanel
          query={query}
          onQueryChange={onQueryChange}
          results={searchResults}
          selectedLocation={selectedLocation}
          weather={weather}
          busy={busy}
          error={error}
          onSearch={onSearch}
          onSelectLocation={onSelectLocation}
          onUseBrowserLocation={onUseBrowserLocation}
          onRefresh={onRefresh}
        />
        <AlertRulesPanel rules={alertRules} onAddRule={onAddRule} onToggleRule={onToggleRule} onRemoveRule={onRemoveRule} />
      </div>
      <div className="grid min-w-0 gap-6">
        <AutomationPanel weather={weather} decision={decision} />
        <DevicePanel
          config={deviceConfig}
          decision={decision}
          message={deviceMessage}
          onChange={onDeviceConfigChange}
          onSendCommand={onSendCommand}
        />
      </div>
    </section>
  );
}

function LocationPanel({
  query,
  onQueryChange,
  results,
  selectedLocation,
  weather,
  busy,
  error,
  onSearch,
  onSelectLocation,
  onUseBrowserLocation,
  onRefresh
}: {
  query: string;
  onQueryChange: (query: string) => void;
  results: LocationResult[];
  selectedLocation: LocationResult;
  weather: LiveWeather | null;
  busy: boolean;
  error: string;
  onSearch: () => void;
  onSelectLocation: (location: LocationResult) => void;
  onUseBrowserLocation: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          <Globe2 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          Global Live Weather Access
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-3 py-2 font-mono text-xs font-semibold text-cyan-300 transition-colors hover:border-cyan-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh Live Feed
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch();
              }
            }}
            className="h-11 w-full rounded border border-slate-800 bg-slate-950/60 pl-10 pr-3 font-mono text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-700"
            placeholder="Search any city, country, or place"
            aria-label="Search global location"
          />
        </label>
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-11 items-center justify-center gap-2 rounded border border-cyan-800 bg-cyan-950/40 px-4 font-mono text-xs font-bold text-cyan-200 transition-colors hover:bg-cyan-900/45"
        >
          <Crosshair className="h-4 w-4" aria-hidden="true" />
          Search
        </button>
        <button
          type="button"
          onClick={onUseBrowserLocation}
          className="inline-flex h-11 items-center justify-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-4 font-mono text-xs font-bold text-slate-300 transition-colors hover:border-cyan-800"
        >
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          My Location
        </button>
      </div>

      {error ? <div className="mt-3 rounded border border-red-900/60 bg-red-950/30 p-3 font-mono text-xs text-red-200">{error}</div> : null}

      {results.length > 0 ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {results.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => onSelectLocation(location)}
              className="rounded border border-slate-800 bg-slate-950/45 p-3 text-left font-mono text-xs text-slate-300 transition-colors hover:border-cyan-800"
            >
              <div className="font-bold text-slate-100">{location.name}</div>
              <div className="mt-1 text-slate-500">{[location.admin1, location.country].filter(Boolean).join(", ")}</div>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <LiveMetric icon={<Thermometer className="h-4 w-4" />} label="Temperature" value={weather ? `${Math.round(weather.current.temperatureC)} deg C` : "--"} />
        <LiveMetric icon={<Wind className="h-4 w-4" />} label="Wind" value={weather ? `${Math.round(weather.current.windSpeedKmh)} km/h` : "--"} />
        <LiveMetric icon={<CloudSun className="h-4 w-4" />} label="Conditions" value={weather?.current.weatherLabel ?? "--"} />
        <LiveMetric icon={<SunMedium className="h-4 w-4" />} label="Solar" value={weather ? `${Math.round(weather.current.shortwaveRadiationWm2)} W/m2` : "--"} />
      </div>

      <div className="mt-3 font-mono text-[11px] text-slate-500">
        Active location: <span className="text-cyan-300">{selectedLocation.name}</span>
      </div>
    </div>
  );
}

function AlertRulesPanel({
  rules,
  onAddRule,
  onToggleRule,
  onRemoveRule
}: {
  rules: AlertRule[];
  onAddRule: (rule: AlertRule) => void;
  onToggleRule: (ruleId: string) => void;
  onRemoveRule: (ruleId: string) => void;
}) {
  const [metric, setMetric] = useState<WeatherMetric>("temperatureC");
  const [operator, setOperator] = useState<AlertOperator>("below");
  const [threshold, setThreshold] = useState("-5");
  const [action, setAction] = useState<AlertAction>("start_generator");
  const [label, setLabel] = useState("Customer weather alert");

  function addRule() {
    onAddRule({
      id: `rule-${Date.now()}`,
      label: label.trim() || "Customer weather alert",
      metric,
      operator,
      threshold: Number(threshold),
      severity: "warning",
      action,
      enabled: true
    });
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          <BellPlus className="h-4 w-4 text-amber-300" aria-hidden="true" />
          Customer Alert Automation
        </h2>
        <button
          type="button"
          onClick={addRule}
          className="inline-flex items-center justify-center gap-2 rounded border border-amber-800/70 bg-amber-950/30 px-3 py-2 font-mono text-xs font-bold text-amber-200 transition-colors hover:bg-amber-900/35"
        >
          <BellPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Alert
        </button>
      </div>

      <div className="mb-4 grid min-w-0 gap-3 rounded border border-slate-800 bg-slate-950/45 p-3 font-mono text-xs md:grid-cols-[minmax(0,1fr)_150px_110px_120px_170px_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-slate-400">Alert Name</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="h-10 rounded border border-slate-800 bg-[#0a0e17] px-3 text-slate-200 outline-none focus:border-cyan-800"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-slate-400">Metric</span>
          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value as WeatherMetric)}
            className="h-10 rounded border border-slate-800 bg-[#0a0e17] px-3 text-slate-200 outline-none focus:border-cyan-800"
          >
            {metricOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-slate-400">When</span>
          <select
            value={operator}
            onChange={(event) => setOperator(event.target.value as AlertOperator)}
            className="h-10 rounded border border-slate-800 bg-[#0a0e17] px-3 text-slate-200 outline-none focus:border-cyan-800"
          >
            <option value="below">Below</option>
            <option value="above">Above</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-slate-400">Threshold</span>
          <input
            type="number"
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            className="h-10 rounded border border-slate-800 bg-[#0a0e17] px-3 text-slate-200 outline-none focus:border-cyan-800"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-slate-400">Action</span>
          <select
            value={action}
            onChange={(event) => setAction(event.target.value as AlertAction)}
            className="h-10 rounded border border-slate-800 bg-[#0a0e17] px-3 text-slate-200 outline-none focus:border-cyan-800"
          >
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={addRule}
          className="inline-flex h-10 items-center justify-center gap-2 rounded border border-amber-800/70 bg-amber-950/30 px-3 font-bold text-amber-200 transition-colors hover:bg-amber-900/35"
        >
          <BellPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Create
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <RuleEditor key={rule.id} rule={rule} onToggleRule={onToggleRule} onRemoveRule={onRemoveRule} />
        ))}
      </div>
    </div>
  );
}

function RuleEditor({
  rule,
  onToggleRule,
  onRemoveRule
}: {
  rule: AlertRule;
  onToggleRule: (ruleId: string) => void;
  onRemoveRule: (ruleId: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded border border-slate-800 bg-slate-950/45 p-3 font-mono text-xs md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
      <div>
        <div className="font-bold text-slate-200">{rule.label}</div>
        <div className="mt-1 text-slate-500">
          {metricOptions.find((metric) => metric.value === rule.metric)?.label} {rule.operator} {rule.threshold}
          {metricOptions.find((metric) => metric.value === rule.metric)?.unit}
        </div>
      </div>
      <span className={`rounded border px-2 py-1 text-[10px] font-bold ${rule.enabled ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-400"}`}>
        {rule.enabled ? "ENABLED" : "DISABLED"}
      </span>
      <span className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
        {actionOptions.find((action) => action.value === rule.action)?.label}
      </span>
      <button
        type="button"
        onClick={() => onToggleRule(rule.id)}
        className="inline-flex items-center justify-center rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-300 transition-colors hover:border-cyan-800"
      >
        <Power className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">Toggle alert rule</span>
      </button>
      <button
        type="button"
        onClick={() => onRemoveRule(rule.id)}
        className="inline-flex items-center justify-center rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-300 transition-colors hover:border-red-800 hover:text-red-300"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">Remove alert rule</span>
      </button>
    </div>
  );
}

function AutomationPanel({ weather, decision }: { weather: LiveWeather | null; decision: AutomationDecision | null }) {
  return (
    <div className="rounded-lg border border-cyan-800/45 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
        <Gauge className="h-4 w-4" aria-hidden="true" />
        Automatic Dispatch Logic
      </h2>
      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
        <DispatchState label="GEN-01" value={decision?.generator1Command ?? "--"} active={decision?.generator1Command === "ON"} />
        <DispatchState label="GEN-02" value={decision?.generator2Command ?? "--"} active={decision?.generator2Command === "ON"} />
        <DispatchState label="Solar Target" value={decision ? `${decision.solarOutputTargetPercent}%` : "--"} active />
        <DispatchState label="Reserve" value={decision ? `${decision.batteryReserveTargetPercent}%` : "--"} active />
      </div>
      <div className="mt-4 space-y-2 font-mono text-xs text-slate-300">
        {(decision?.rationale ?? [`Waiting for live weather feed${weather ? "" : "..."}`]).map((line) => (
          <div key={line} className="rounded border border-slate-800 bg-slate-950/45 p-2.5">
            {line}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-slate-500">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
        Backend automation endpoint active
      </div>
    </div>
  );
}

function DevicePanel({
  config,
  decision,
  message,
  onChange,
  onSendCommand
}: {
  config: DeviceConfig;
  decision: AutomationDecision | null;
  message: string;
  onChange: (config: DeviceConfig) => void;
  onSendCommand: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <h2 className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        <PlugZap className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        Solar and Generator Controls
      </h2>
      <div className="grid gap-3 font-mono text-xs">
        <SegmentedControl
          label="Generator Mode"
          value={config.generatorMode}
          options={["auto", "manual"]}
          onChange={(generatorMode) => onChange({ ...config, generatorMode: generatorMode as DeviceConfig["generatorMode"] })}
        />
        <SegmentedControl
          label="Solar Mode"
          value={config.solarMode}
          options={["auto", "manual"]}
          onChange={(solarMode) => onChange({ ...config, solarMode: solarMode as DeviceConfig["solarMode"] })}
        />
        <RangeControl
          label="Solar Output Target"
          value={config.solarOutputTargetPercent}
          min={20}
          max={100}
          unit="%"
          onChange={(solarOutputTargetPercent) => onChange({ ...config, solarOutputTargetPercent })}
        />
        <RangeControl
          label="Battery Reserve"
          value={config.batteryReserveTargetPercent}
          min={15}
          max={80}
          unit="%"
          onChange={(batteryReserveTargetPercent) => onChange({ ...config, batteryReserveTargetPercent })}
        />
        <RangeControl
          label="Non-critical Load Limit"
          value={config.nonCriticalLoadLimitPercent}
          min={30}
          max={100}
          unit="%"
          onChange={(nonCriticalLoadLimitPercent) => onChange({ ...config, nonCriticalLoadLimitPercent })}
        />
        <label className="grid gap-2">
          <span className="text-slate-400">Hardware Provider</span>
          <select
            value={config.hardwareProvider}
            onChange={(event) => onChange({ ...config, hardwareProvider: event.target.value as DeviceConfig["hardwareProvider"] })}
            className="h-10 rounded border border-slate-800 bg-slate-950 px-3 text-slate-200 outline-none focus:border-cyan-800"
          >
            <option value="demo">Demo gateway</option>
            <option value="modbus">Modbus gateway</option>
            <option value="mqtt">MQTT bridge</option>
            <option value="rest">REST inverter API</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-slate-400">Gateway Endpoint</span>
          <input
            value={config.endpointUrl}
            onChange={(event) => onChange({ ...config, endpointUrl: event.target.value })}
            className="h-10 rounded border border-slate-800 bg-slate-950 px-3 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-800"
            placeholder="https://gateway.customer-site.example/control"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onSendCommand}
        disabled={!decision}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded border border-emerald-800/70 bg-emerald-950/35 px-4 py-2.5 font-mono text-xs font-bold text-emerald-200 transition-colors hover:bg-emerald-900/35 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Send Command Payload
      </button>

      {message ? (
        <div className="mt-3 rounded border border-slate-800 bg-slate-950/45 p-3 font-mono text-xs text-slate-300">{message}</div>
      ) : null}
    </div>
  );
}

function LiveMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/45 p-3 font-mono text-xs">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </div>
      <div className="font-bold text-slate-100">{value}</div>
    </div>
  );
}

function DispatchState({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/45 p-3">
      <div className="text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${active ? "text-emerald-300" : "text-slate-400"}`}>{value}</div>
    </div>
  );
}

function SegmentedControl({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-slate-400">{label}</span>
      <div className="grid grid-cols-2 overflow-hidden rounded border border-slate-800 bg-slate-950">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`px-3 py-2 font-bold uppercase transition-colors ${
              value === option ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeControl({
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
    <label className="grid gap-2">
      <span className="flex items-center justify-between text-slate-400">
        {label}
        <span className="font-bold text-slate-100">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-cyan-400"
      />
    </label>
  );
}
