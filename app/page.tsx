"use client";

import { useEffect, useState } from "react";
import { DigitalTwin } from "@/components/DigitalTwin";
import { EnergyMixLoadSection } from "@/components/EnergyMixLoadSection";
import { EnvironmentAlerts } from "@/components/EnvironmentAlerts";
import { ForecastDispatchChart } from "@/components/ForecastDispatchChart";
import { Header } from "@/components/Header";
import { KPICards } from "@/components/KPICards";
import { OptimizationAISection } from "@/components/OptimizationAISection";
import { fetchStationData } from "@/services/api";
import { Scenario, StationData } from "@/types/station";

export default function Dashboard() {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [data, setData] = useState<StationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    fetchStationData(scenario).then((stationData) => {
      if (isMounted) {
        setData(stationData);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [scenario]);

  if (loading || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b12] px-4 font-mono text-cyan-300">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.95)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.12em]">Initializing POLAR-E telemetry kernel...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b12] pb-12 text-slate-100 selection:bg-cyan-400 selection:text-slate-950">
      <Header
        stationName={data.station.name}
        location={data.station.location}
        systemStatus={data.station.systemStatus}
        lastUpdated={data.station.lastUpdated}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-6 sm:px-6">
        <KPICards data={data} />
        <EnvironmentAlerts data={data} />
        <ForecastDispatchChart data={data} />
        <EnergyMixLoadSection data={data} />
        <OptimizationAISection data={data} />
        <DigitalTwin currentScenario={scenario} onSelectScenario={setScenario} data={data} />
      </div>
    </main>
  );
}
