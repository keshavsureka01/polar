import { Activity, MapPin } from "lucide-react";

interface HeaderProps {
  stationName: string;
  location: string;
  systemStatus: string;
  lastUpdated: string;
}

export function Header({ stationName, location, systemStatus, lastUpdated }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-[#0a0e17] px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded border border-cyan-500/35 bg-cyan-950/35 p-2 text-cyan-300">
            <Activity className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-[0.18em] text-slate-100">POLAR-E</h1>
              <span className="rounded border border-cyan-800 bg-cyan-950/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-300">
                AI KERNEL v2.4
              </span>
            </div>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.08em] text-slate-400">
              AI energy command center - Antarctic research telemetry
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <span className="text-slate-500">STATION</span>
            <span className="font-semibold text-cyan-300">{stationName}</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span className="text-slate-300">{location}</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-emerald-800/60 bg-emerald-950/25 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)]" />
            <span className="font-semibold text-emerald-300">{systemStatus}</span>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-400">
            UPDATED <span className="text-slate-200">{lastUpdated}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
