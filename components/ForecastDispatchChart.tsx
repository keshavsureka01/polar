import { TrendingUp } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StationData } from "@/types/station";

interface ForecastDispatchChartProps {
  data: StationData;
}

export function ForecastDispatchChart({ data }: ForecastDispatchChartProps) {
  return (
    <section className="rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          <TrendingUp className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          48-Hour Forecast and Optimized Dispatch
        </h2>
        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-1 font-mono text-xs text-slate-400">
          Model horizon: <span className="font-semibold text-cyan-300">+48 hours</span> / 6h intervals
        </div>
      </div>
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.forecast} margin={{ top: 10, right: 18, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timeOffset" stroke="#64748b" tick={axisTick} />
            <YAxis stroke="#64748b" tick={axisTick} unit=" kW" />
            <Tooltip contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace", paddingTop: 8 }} />
            <Line
              type="monotone"
              dataKey="demandKw"
              name="Station Demand"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line type="monotone" dataKey="renewableKw" name="Renewable Generation" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            <Line
              type="monotone"
              dataKey="generatorKw"
              name="Optimized Diesel Output"
              stroke="#38bdf8"
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

const axisTick = { fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" };
const tooltipContentStyle = {
  backgroundColor: "#0f172a",
  borderColor: "#334155",
  borderRadius: "6px",
  color: "#e2e8f0",
  fontSize: "12px",
  fontFamily: "monospace"
};
const tooltipItemStyle = { color: "#e2e8f0", padding: "2px 0" };
const tooltipLabelStyle = { color: "#38bdf8", fontWeight: "bold", marginBottom: "4px" };
