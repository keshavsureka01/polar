import { PieChart, ShieldCheck, Zap } from "lucide-react";
import { StationData } from "@/types/station";

interface EnergyMixLoadSectionProps {
  data: StationData;
}

export function EnergyMixLoadSection({ data }: EnergyMixLoadSectionProps) {
  const { energy, loads } = data;
  const totalRenewable = energy.solarGenerationKw + energy.windGenerationKw;
  const totalPower = totalRenewable + energy.dieselGenerationKw;
  const renewableShare = totalPower > 0 ? ((totalRenewable / totalPower) * 100).toFixed(1) : "0.0";
  const dieselShare = totalPower > 0 ? ((energy.dieselGenerationKw / totalPower) * 100).toFixed(1) : "0.0";

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <PieChart className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              Power Dispatch and Energy Mix
            </h2>
            <span className="rounded border border-cyan-800/60 bg-cyan-950/30 px-2 py-0.5 font-mono text-xs text-cyan-300">
              Total Load: {energy.totalLoadKw} kW
            </span>
          </div>

          <div className="mb-6 space-y-3 font-mono text-xs">
            <PowerRow color="bg-amber-300" label="Solar Array" value={`${energy.solarGenerationKw} kW`} />
            <PowerRow color="bg-emerald-400" label="Wind Turbines" value={`${energy.windGenerationKw} kW`} />
            <PowerRow color="bg-cyan-400" label="Diesel Generators" value={`${energy.dieselGenerationKw} kW`} />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex justify-between gap-3 font-mono text-xs text-slate-400">
            <span>
              Renewable: <strong className="text-emerald-300">{renewableShare}%</strong>
            </span>
            <span>
              Diesel: <strong className="text-cyan-300">{dieselShare}%</strong>
            </span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded bg-slate-800">
            <div className="h-full bg-amber-300" style={{ width: `${safeShare(energy.solarGenerationKw, totalPower)}%` }} title="Solar" />
            <div className="h-full bg-emerald-500" style={{ width: `${safeShare(energy.windGenerationKw, totalPower)}%` }} title="Wind" />
            <div className="h-full bg-cyan-500" style={{ width: `${safeShare(energy.dieselGenerationKw, totalPower)}%` }} title="Diesel" />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <Zap className="h-4 w-4 text-amber-300" aria-hidden="true" />
              Load Priority and Shedding Matrix
            </h2>
            <span className="flex items-center gap-1.5 rounded border border-emerald-800/60 bg-emerald-950/30 px-2.5 py-1 font-mono text-xs text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Critical Protection 100%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">Load Asset</th>
                  <th className="pb-2 font-medium">Priority</th>
                  <th className="pb-2 text-right font-medium">Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {loads.map((load) => (
                  <tr key={load.id} className="transition-colors hover:bg-slate-950/45">
                    <td className="py-2.5 font-medium text-slate-200">{load.name}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                          load.category === "CRITICAL"
                            ? "border-red-900/70 bg-red-950/50 text-red-300"
                            : "border-slate-700 bg-slate-800 text-slate-300"
                        }`}
                      >
                        {load.category}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-100">
                      <div className="flex items-center justify-end gap-2">
                        <span>{load.currentPercent}%</span>
                        <div className="hidden h-1.5 w-12 overflow-hidden rounded bg-slate-800 sm:block">
                          <div
                            className={`h-full ${load.category === "CRITICAL" ? "bg-red-500" : "bg-cyan-400"}`}
                            style={{ width: `${load.currentPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function PowerRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-slate-800 bg-slate-950/45 p-2.5">
      <span className="flex items-center gap-2 text-slate-300">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-bold text-slate-100">{value}</span>
    </div>
  );
}

function safeShare(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}
