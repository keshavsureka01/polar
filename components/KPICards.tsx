import { Battery, Fuel, Sun, Zap } from "lucide-react";
import { StationData } from "@/types/station";

interface KPICardsProps {
  data: StationData;
}

export function KPICards({ data }: KPICardsProps) {
  const { fuel, battery, energy } = data;
  const totalRenewable = energy.solarGenerationKw + energy.windGenerationKw;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KPIFrame
        icon={<Fuel className="h-4 w-4 text-amber-300" aria-hidden="true" />}
        label="Fuel Endurance"
        status={`${fuel.burnRateLph} L/hr`}
        statusClassName="border-amber-800/60 bg-amber-950/30 text-amber-300"
      >
        <KPIValue value={fuel.enduranceDays} unit="days" />
        <KPIFooter label="Exhaustion estimate" value={fuel.exhaustionDate} />
      </KPIFrame>

      <KPIFrame
        icon={<Battery className="h-4 w-4 text-cyan-300" aria-hidden="true" />}
        label="Battery SOC"
        status={`${battery.isCharging ? "+" : "-"}${Math.abs(battery.chargeDischargeKw)} kW`}
        statusClassName={
          battery.isCharging
            ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
            : "border-amber-800/60 bg-amber-950/30 text-amber-300"
        }
      >
        <div className="flex items-end gap-4">
          <KPIValue value={battery.socPercent} unit="%" />
          <div className="mb-2 h-2.5 min-w-24 flex-1 overflow-hidden rounded bg-slate-800">
            <div
              className={`h-full rounded ${battery.socPercent < 35 ? "bg-red-500" : "bg-cyan-400"}`}
              style={{ width: `${battery.socPercent}%` }}
            />
          </div>
        </div>
        <KPIFooter label="Emergency reserve" value={`${battery.emergencyReservePercent}% threshold`} />
      </KPIFrame>

      <KPIFrame
        icon={<Zap className="h-4 w-4 text-amber-300" aria-hidden="true" />}
        label="Station Load"
        status="Active Grid"
        statusClassName="border-cyan-800/60 bg-cyan-950/30 text-cyan-300"
      >
        <KPIValue value={energy.totalLoadKw} unit="kW" />
        <div className="flex justify-between gap-3 border-t border-slate-800/80 pt-2 font-mono text-xs">
          <span className="text-emerald-300">Critical: {energy.criticalLoadKw} kW</span>
          <span className="text-slate-400">Non-crit: {energy.nonCriticalLoadKw} kW</span>
        </div>
      </KPIFrame>

      <KPIFrame
        icon={<Sun className="h-4 w-4 text-emerald-300" aria-hidden="true" />}
        label="Renewable Output"
        status="Green Mix"
        statusClassName="border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
      >
        <KPIValue value={totalRenewable} unit="kW" />
        <div className="flex justify-between gap-3 border-t border-slate-800/80 pt-2 font-mono text-xs text-slate-400">
          <span>Solar: {energy.solarGenerationKw} kW</span>
          <span>Wind: {energy.windGenerationKw} kW</span>
        </div>
      </KPIFrame>
    </section>
  );
}

function KPIFrame({
  icon,
  label,
  status,
  statusClassName,
  children
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  statusClassName: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition-colors hover:border-cyan-500/35">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          {icon}
          {label}
        </h2>
        <span className={`rounded border px-2 py-0.5 font-mono text-xs ${statusClassName}`}>{status}</span>
      </div>
      {children}
    </article>
  );
}

function KPIValue({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="mb-1 font-mono text-3xl font-extrabold text-slate-100">
      {value} <span className="text-sm font-normal text-slate-400">{unit}</span>
    </div>
  );
}

function KPIFooter({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 pt-2 font-mono text-xs text-slate-400">
      <span>{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}
