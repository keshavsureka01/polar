"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DigitalTwin } from "@/components/DigitalTwin";
import { EnergyMixLoadSection } from "@/components/EnergyMixLoadSection";
import { EnvironmentAlerts } from "@/components/EnvironmentAlerts";
import { ForecastDispatchChart } from "@/components/ForecastDispatchChart";
import { Header } from "@/components/Header";
import { InteractiveBackdrop } from "@/components/InteractiveBackdrop";
import { KPICards } from "@/components/KPICards";
import { LiveOperationsPanel } from "@/components/LiveOperationsPanel";
import { MotionGlobeView } from "@/components/MotionGlobeView";
import { buildLiveStationData } from "@/lib/liveStation";
import { fetchLiveWeather, reverseGeocodeCurrentLocation, runAutomation, searchLocations, sendDeviceCommand } from "@/services/liveApi";
import { fetchLiveStationWeather, POLAR_STATIONS, PolarStation } from "@/services/polarApi";
import { fetchAiBriefing, fetchStationData } from "@/services/api";
import {
  AlertRule,
  AutomationDecision,
  defaultAlertRules,
  defaultDeviceConfig,
  DeviceConfig,
  LiveWeather,
  LocationResult
} from "@/types/live";
import { Scenario, StationData } from "@/types/station";

const initialStation = POLAR_STATIONS[0];

export default function Dashboard() {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [selectedStation, setSelectedStation] = useState<PolarStation>(initialStation);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult>(initialStation);
  const [query, setQuery] = useState(initialStation.name);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [decision, setDecision] = useState<AutomationDecision | null>(null);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(defaultAlertRules);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>(defaultDeviceConfig);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [deviceMessage, setDeviceMessage] = useState("");
  const [backendStationData, setBackendStationData] = useState<StationData | null>(null);
  const [baselineStationData, setBaselineStationData] = useState<StationData | null>(null);
  const scenarioRequestId = useRef(0);
  const weatherRequestId = useRef(0);

  useEffect(() => {
    const savedRules = window.localStorage.getItem("polar-e-alert-rules");
    const savedDeviceConfig = window.localStorage.getItem("polar-e-device-config");

    try {
      if (savedRules) {
        setAlertRules(JSON.parse(savedRules) as AlertRule[]);
      }
      if (savedDeviceConfig) {
        setDeviceConfig(JSON.parse(savedDeviceConfig) as DeviceConfig);
      }
    } catch {
      window.localStorage.removeItem("polar-e-alert-rules");
      window.localStorage.removeItem("polar-e-device-config");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("polar-e-alert-rules", JSON.stringify(alertRules));
  }, [alertRules]);

  useEffect(() => {
    window.localStorage.setItem("polar-e-device-config", JSON.stringify(deviceConfig));
  }, [deviceConfig]);

  const refreshWeather = useCallback(async () => {
    const requestId = ++weatherRequestId.current;
    setBusy(true);
    setError("");

    try {
      const selectedPolarStation = POLAR_STATIONS.find((station) => station.id === selectedLocation.id);
      const nextWeather = selectedPolarStation ? await fetchLiveStationWeather(selectedPolarStation) : await fetchLiveWeather(selectedLocation);
      if (requestId === weatherRequestId.current) {
        setWeather(nextWeather);
      }
    } catch (err) {
      if (requestId === weatherRequestId.current) {
        setError(err instanceof Error ? err.message : "Unable to refresh live weather");
      }
    } finally {
      if (requestId === weatherRequestId.current) {
        setBusy(false);
      }
    }
  }, [selectedLocation]);

  useEffect(() => {
    refreshWeather();
    const timer = window.setInterval(refreshWeather, 60000);

    return () => window.clearInterval(timer);
  }, [refreshWeather]);

  useEffect(() => {
    if (!weather) {
      return;
    }

    let active = true;
    runAutomation(weather, alertRules, deviceConfig)
      .then((nextDecision) => {
        if (active) {
          setDecision(nextDecision);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Automation backend failed");
        }
      });

    return () => {
      active = false;
    };
  }, [weather, alertRules, deviceConfig]);

  useEffect(() => {
    let active = true;
    fetchStationData("normal").then((nextData) => {
      if (active) {
        setBaselineStationData(nextData);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const requestId = ++scenarioRequestId.current;
    let active = true;
    fetchStationData(scenario).then((nextData) => {
      if (active && requestId === scenarioRequestId.current) {
        setBackendStationData(nextData);
        const baseline = baselineStationData ?? (scenario === "normal" ? nextData : null);
        if (baseline) {
          fetchAiBriefing(scenario, baseline, nextData).then((briefing) => {
            if (briefing && active && requestId === scenarioRequestId.current) {
              setBackendStationData((current) => current ? { ...current, recommendation: { ...current.recommendation, ...briefing } } : current);
            }
          });
        }
      }
    });

    return () => {
      active = false;
    };
  }, [scenario, baselineStationData]);

  const stationData: StationData | null = useMemo(() => {
    if (!weather || !decision) {
      return baselineStationData ?? backendStationData;
    }

    return buildLiveStationData(weather, decision, deviceConfig);
  }, [baselineStationData, backendStationData, weather, decision, deviceConfig]);

  const scenarioData = backendStationData ?? stationData;
  const scenarioBaseline = baselineStationData ?? stationData;

  const handleSelectLocation = useCallback((location: LocationResult, closeResults = true) => {
    setSelectedLocation(location);
    const matchingStation = POLAR_STATIONS.find((station) => station.id === location.id);
    setSelectedStation(matchingStation ?? initialStation);
    setQuery(location.name);
    if (closeResults) {
      setSearchResults([]);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const results = await searchLocations(query);
      setSearchResults(results);
      if (results[0]) {
        handleSelectLocation(results[0], false);
      } else {
        setError(`No location matched "${query.trim()}"`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Location search failed");
    } finally {
      setBusy(false);
    }
  };

  const handleUseBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser location is not available on this device");
      return;
    }

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = await reverseGeocodeCurrentLocation(position.coords.latitude, position.coords.longitude);
          handleSelectLocation({
            ...location,
            elevation: position.coords.altitude ?? location.elevation
          });
        } catch {
          handleSelectLocation({
            id: `gps-${position.coords.latitude.toFixed(5)},${position.coords.longitude.toFixed(5)}`,
            name: "Current Device Location",
            country: "GPS coordinates",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            elevation: position.coords.altitude ?? undefined,
            timezone: "auto"
          });
        } finally {
          setBusy(false);
        }
      },
      () => {
        setError("Location permission was denied or unavailable");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectStation = useCallback((station: PolarStation) => {
    setSelectedStation(station);
    setSelectedLocation(station);
    setSearchResults([]);
    setQuery(station.name);
  }, []);

  useEffect(() => {
    setBusy(true);
    setError("");
  }, [selectedLocation.id]);

  const handleAddRule = (rule: AlertRule) => {
    setAlertRules((current) => [...current, rule]);
  };

  const handleToggleRule = (ruleId: string) => {
    setAlertRules((current) => current.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule)));
  };

  const handleRemoveRule = (ruleId: string) => {
    setAlertRules((current) => current.filter((rule) => rule.id !== ruleId));
  };

  const handleSendCommand = async () => {
    if (!decision) {
      return;
    }

    try {
      const response = await sendDeviceCommand(decision, deviceConfig);
      setDeviceMessage(response.message);
    } catch (err) {
      setDeviceMessage(err instanceof Error ? err.message : "Device command failed");
    }
  };

  const SectionTitle = ({
    eyebrow,
    title,
    description
  }: {
    eyebrow: string;
    title: string;
    description: string;
  }) => (
    <div className="flex flex-col gap-1 border-l border-cyan-500/40 pl-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400">
        {eyebrow}
      </div>
      <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">{title}</h2>
      <p className="max-w-3xl text-xs leading-5 text-slate-400 sm:text-sm">
        {description}
      </p>
    </div>
  );

  if (!stationData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b12] px-4 font-mono text-cyan-300">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.95)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.12em]">Synchronizing live POLAR-E telemetry...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b12] pb-12 text-slate-100 selection:bg-cyan-400 selection:text-slate-950">
      <InteractiveBackdrop />
      <Header
        stationName={stationData.station.name}
        location={stationData.station.location}
        systemStatus={stationData.station.systemStatus}
        lastUpdated={stationData.station.lastUpdated}
      />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6">
        <section className="panel-rise rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.45)] sm:p-6">
          <div className="mb-5">
            <SectionTitle
              eyebrow="Operations Deck"
              title="Live station control and geographic selection"
              description="Use the station selector, live weather search, alert rules, and device controls from one operational surface."
            />
          </div>
          <div className="grid gap-6">
            <MotionGlobeView selectedStation={selectedStation} active={!busy && !error} onSelectStation={handleSelectStation} />
            <LiveOperationsPanel
              query={query}
              onQueryChange={setQuery}
              searchResults={searchResults}
              selectedLocation={selectedLocation}
              weather={weather}
              decision={decision}
              alertRules={alertRules}
              deviceConfig={deviceConfig}
              busy={busy}
              deviceMessage={deviceMessage}
              error={error}
              onSearch={handleSearch}
              onSelectLocation={handleSelectLocation}
              onUseBrowserLocation={handleUseBrowserLocation}
              onRefresh={refreshWeather}
              onAddRule={handleAddRule}
              onToggleRule={handleToggleRule}
              onRemoveRule={handleRemoveRule}
              onDeviceConfigChange={setDeviceConfig}
              onSendCommand={handleSendCommand}
            />
          </div>
        </section>

        <section className="panel-rise rounded-2xl border border-slate-800/80 bg-slate-950/30 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.35)] sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <SectionTitle
              eyebrow="Telemetry Dashboard"
              title="System status, climate, dispatch, and load balance"
              description="These panels are grouped as read-only operational telemetry, so the decision and control tools stay isolated from the monitoring layer."
            />
          </div>

          <div className="grid gap-6">
            <KPICards data={stationData} />
            <EnvironmentAlerts data={stationData} />
            <ForecastDispatchChart data={stationData} />
            <EnergyMixLoadSection data={stationData} />
          </div>
        </section>

        <section className="panel-rise rounded-2xl border border-cyan-900/50 bg-gradient-to-b from-slate-950/40 to-slate-950/20 p-4 shadow-[0_24px_80px_rgba(8,47,73,0.2)] sm:p-6">
          <div className="mb-5">
            <SectionTitle
              eyebrow="Scenario Lab"
              title="What-if analysis and automation response"
              description="This area is separated from routine telemetry so simulations, recommendations, and dispatch logic are easy to inspect without mixing them into the main dashboard."
            />
          </div>
          {scenarioData && scenarioBaseline ? (
            <DigitalTwin
              currentScenario={scenario}
              onSelectScenario={setScenario}
              data={scenarioData}
              baselineData={scenarioBaseline}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
