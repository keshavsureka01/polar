"use client";

import { Bot, ChevronDown, ChevronUp, Cpu, Sparkles } from "lucide-react";
import { useState } from "react";
import { StationData } from "@/types/station";

interface OptimizationAISectionProps {
  data: StationData;
}

export function OptimizationAISection({ data }: OptimizationAISectionProps) {
  const { optimizationImpact, recommendation } = data;
  const [expandedWhy, setExpandedWhy] = useState(false);

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <Cpu className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              Optimization Impact Analysis
            </h2>
            <span className="rounded border border-slate-800 bg-slate-950/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
              Simulation vs rule-based
            </span>
          </div>
          <p className="mb-4 font-mono text-xs text-slate-400">Performance metrics evaluated against legacy dispatch protocols.</p>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <ImpactTile label="Fuel Consumption" value={`-${optimizationImpact.fuelConsumptionReductionPercent}%`} tone="green" />
            <ImpactTile label="Generator Runtime" value={`-${optimizationImpact.generatorRuntimeReductionPercent}%`} tone="green" />
            <ImpactTile label="Renewable Utilization" value={`+${optimizationImpact.renewableUtilizationImprovementPercent}%`} tone="cyan" />
            <ImpactTile label="Critical Reliability" value={`${optimizationImpact.criticalLoadReliabilityPercent}%`} tone="white" />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-lg border border-cyan-900/60 bg-[#111827] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-cyan-300">
              <Bot className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              POLAR-E AI Decision Briefing
            </h2>
            <span className="flex items-center gap-1 rounded border border-cyan-800 bg-cyan-950/60 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Groq Inference Engine
            </span>
          </div>

          <div className="mb-4 rounded border border-cyan-500/30 bg-cyan-950/20 p-3.5">
            <div className="mb-1 font-mono text-xs text-slate-400">RECOMMENDED ACTION</div>
            <div className="font-mono text-sm font-bold tracking-[0.08em] text-cyan-100">{recommendation.action}</div>
          </div>

          <button
            type="button"
            onClick={() => setExpandedWhy((current) => !current)}
            className="flex w-full cursor-pointer items-center justify-between rounded border border-slate-800 bg-slate-950/60 px-3 py-2 font-mono text-xs text-slate-300 transition-colors hover:border-cyan-800 hover:bg-slate-950"
            aria-expanded={expandedWhy}
          >
            <span className="font-semibold text-cyan-300">WHY THIS DECISION?</span>
            {expandedWhy ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
          </button>

          {expandedWhy ? (
            <div className="mt-3 space-y-2 rounded border border-slate-800 bg-slate-950/40 p-3 font-mono text-xs text-slate-300">
              {recommendation.reasoning.map((reason) => (
                <div key={reason} className="flex items-start gap-2">
                  <span className="mt-0.5 text-cyan-300">-</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-between gap-3 border-t border-slate-800 pt-3 font-mono text-xs text-slate-400">
          <span>
            Est. Fuel Saving: <strong className="text-emerald-300">+{recommendation.fuelSavingPercent}%</strong>
          </span>
          <span>
            Critical Protection: <strong className="text-emerald-300">{recommendation.criticalLoadProtectionPercent}%</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

function ImpactTile({ label, value, tone }: { label: string; value: string; tone: "green" | "cyan" | "white" }) {
  const toneClass = tone === "green" ? "text-emerald-300" : tone === "cyan" ? "text-cyan-300" : "text-slate-100";

  return (
    <div className="rounded border border-slate-800 bg-slate-950/45 p-3">
      <div className="mb-1 text-[11px] text-slate-400">{label}</div>
      <div className={`text-lg font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
