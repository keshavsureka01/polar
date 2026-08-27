"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DigitalTwin } from "@/components/DigitalTwin";
import { EnergyMixLoadSection } from "@/components/EnergyMixLoadSection";
import { EnvironmentAlerts } from "@/components/EnvironmentAlerts";
import { ForecastDispatchChart } from "@/components/ForecastDispatchChart";
import { Header } from "@/components/Header";
import { KPICards } from "@/components/KPICards";
import { LiveOperationsPanel } from "@/components/LiveOperationsPanel";
import { MotionGlobeView } from "@/components/MotionGlobeView";
import { buildLiveStationData } from "@/lib/liveStation";
import { fetchLiveWeather, runAutomation, searchLocations, sendDeviceCommand } from "@/services/liveApi";
import { fetchLiveStationWeather, POLAR_STATIONS, PolarStation } from "@/services/polarApi";
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
  const [query, setQuery] = useState("Bengaluru");
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [decision, setDecision] = useState<AutomationDecision | null>(null);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(defaultAlertRules);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>(defaultDeviceConfig);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [deviceMessage, setDeviceMessage] = useState("");

  useEffect(() => {
    const savedRules = window.localStorage.getItem("polar-e-alert-rules");
    const savedDeviceConfig = window.localStorage.getItem("polar-e-device-config");

    if (savedRules) {
      setAlertRules(JSON.parse(savedRules) as AlertRule[]);
    }
    if (savedDeviceConfig) {
      setDeviceConfig(JSON.parse(savedDeviceConfig) as DeviceConfig);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("polar-e-alert-rules", JSON.stringify(alertRules));
  }, [alertRules]);

  useEffect(() => {
    window.localStorage.setItem("polar-e-device-config", JSON.stringify(deviceConfig));
  }, [deviceConfig]);

  const refreshWeather = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const selectedPolarStation = POLAR_STATIONS.find((station) => station.id === selectedLocation.id);
      const nextWeather = selectedPolarStation ? await fetchLiveStationWeather(selectedPolarStation) : await fetchLiveWeather(selectedLocation);
      setWeather(nextWeather);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh live weather");
    } finally {
      setBusy(false);
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

  const stationData: StationData | null = useMemo(() => {
    if (!weather || !decision) {
      return null;
    }

    return buildLiveStationData(weather, decision, deviceConfig);
  }, [weather, decision, deviceConfig]);

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
        setSelectedLocation(results[0]);
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
      (position) => {
        setSelectedLocation({
          id: "browser-location",
          name: "Current Device Location",
          country: "Browser GPS",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          elevation: position.coords.altitude ?? undefined,
          timezone: "auto"
        });
        setBusy(false);
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

  const handleSelectLocation = useCallback((location: LocationResult) => {
    setSelectedLocation(location);
    const matchingStation = POLAR_STATIONS.find((station) => station.id === location.id);
    if (matchingStation) {
      setSelectedStation(matchingStation);
    }
  }, []);

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
      <Header
        stationName={stationData.station.name}
        location={stationData.station.location}
        systemStatus={stationData.station.systemStatus}
        lastUpdated={stationData.station.lastUpdated}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-6 sm:px-6">
        <MotionGlobeView selectedStation={selectedStation} active={!busy && !error} onSelectStation={handleSelectStation} />

        <section className="grid gap-6">
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
        </section>

        <KPICards data={stationData} />
        <EnvironmentAlerts data={stationData} />
        <ForecastDispatchChart data={stationData} />
        <EnergyMixLoadSection data={stationData} />
        <DigitalTwin currentScenario={scenario} onSelectScenario={setScenario} data={stationData} />
      </div>
    </main>
  );
}
