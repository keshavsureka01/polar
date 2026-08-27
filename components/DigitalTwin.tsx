import { Activity, AlertOctagon, Cpu, Snowflake, Wind } from "lucide-react";
import { Scenario, StationData } from "@/types/station";

interface DigitalTwinProps {
  currentScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  data: StationData;
}

const scenarioLabels: Record<Scenario, string> = {
  normal: "NORMAL",
  extreme_cold: "-45C BLIZZARD",
  wind_icing: "TURBINE ICING",
  generator_failure: "GEN-01 FAILURE"
};

export function DigitalTwin({ currentScenario, onSelectScenario, data }: DigitalTwinProps) {
  return (
    <section className="rounded-lg border border-cyan-800/45 bg-[#111827] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.16em] text-cyan-300">
            <Cpu className="h-5 w-5 text-cyan-300" aria-hidden="true" />
            Digital Twin / What-If Scenario Simulator
          </h2>
          <p className="mt-1 font-mono text-xs text-slate-400">
            Test station resilience under extreme polar contingencies and emergency failure modes.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:flex sm:items-center">
          <ScenarioButton
            icon={<Activity className="h-3.5 w-3.5" aria-hidden="true" />}
            label="NORMAL"
            selected={currentScenario === "normal"}
            onClick={() => onSelectScenario("normal")}
          />
          <ScenarioButton
            icon={<Snowflake className="h-3.5 w-3.5" aria-hidden="true" />}
            label="-45C BLIZZARD"
            selected={currentScenario === "extreme_cold"}
            onClick={() => onSelectScenario("extreme_cold")}
          />
          <ScenarioButton
            icon={<Wind className="h-3.5 w-3.5" aria-hidden="true" />}
            label="TURBINE ICING"
            selected={currentScenario === "wind_icing"}
            onClick={() => onSelectScenario("wind_icing")}
          />
          <ScenarioButton
            icon={<AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />}
            label="GEN-01 FAILURE"
            selected={currentScenario === "generator_failure"}
            critical
            onClick={() => onSelectScenario("generator_failure")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 font-mono lg:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Generator Fleet Status</h3>
          <div className="space-y-3 text-xs">
            {data.generators.map((generator) => (
              <div key={generator.id} className="flex items-center justify-between gap-3 rounded border border-slate-800 bg-[#0a0e17] p-2.5">
                <div>
                  <div className="font-bold text-slate-200">{generator.id}</div>
                  <div className="text-[10px] text-slate-400">{generator.name}</div>
                </div>
                <div className="text-right">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${generatorStatusStyle(generator.status)}`}>
                    {generator.status}
                  </span>
                  <div className="mt-1 text-[10px] text-slate-400">{generator.loadKw} kW load</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Microgrid Telemetry Delta</h3>
          <div className="space-y-2 text-xs">
            <DeltaRow label="Fuel Endurance" value={`${data.fuel.enduranceDays} days`} tone="amber" />
            <DeltaRow label="Battery State of Charge" value={`${data.battery.socPercent}%`} tone="cyan" />
            <DeltaRow label="Critical Load Reliability" value="100% Protected" tone="green" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950/45 p-4">
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-cyan-300">
              <Cpu className="h-4 w-4" aria-hidden="true" />
              AI Contingency Response
            </h3>
            <p className="rounded border border-slate-800 bg-[#0a0e17] p-3 text-xs leading-relaxed text-slate-300">
              {data.recommendation.action}: {data.recommendation.reasoning[0]}
            </p>
          </div>
          <div className="mt-4 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
            Active scenario mode: <span className="font-bold uppercase text-cyan-300">{scenarioLabels[currentScenario]}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScenarioButton({
  icon,
  label,
  selected,
  critical = false,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  critical?: boolean;
  onClick: () => void;
}) {
  const selectedClass = critical
    ? "border-red-400 bg-red-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.18)]"
    : "border-cyan-400 bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.18)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded border px-3 py-2 font-bold transition-colors ${
        selected ? selectedClass : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DeltaRow({ label, value, tone }: { label: string; value: string; tone: "amber" | "cyan" | "green" }) {
  const toneClass = tone === "amber" ? "text-amber-300" : tone === "cyan" ? "text-cyan-300" : "text-emerald-300";

  return (
    <div className="flex justify-between gap-3 rounded border border-slate-800 bg-[#0a0e17] p-2">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold ${toneClass}`}>{value}</span>
    </div>
  );
}

function generatorStatusStyle(status: "ON" | "OFF" | "FAILED") {
  switch (status) {
    case "ON":
      return "border-emerald-800 bg-emerald-950/60 text-emerald-300";
    case "FAILED":
      return "border-red-800 bg-red-950/60 text-red-300";
    default:
      return "border-slate-700 bg-slate-800 text-slate-400";
  }
}
