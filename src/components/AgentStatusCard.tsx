import type { MouseEvent } from "react";

export type AgentStatus = "online" | "degraded" | "offline" | "unknown";

export interface AgentStatusCardProps {
  agent: {
    id: string;
    name: string;
    status: AgentStatus;
    metrics: {
      requestsPerMinute: number;
      successRate: number;
      avgLatency: number;
      costToday: number;
      requestHistory: number[];
    };
  };
  onExpand?: (event: MouseEvent<HTMLButtonElement>) => void;
  expanded?: boolean;
}

const statusStyles: Record<AgentStatus, { label: string; dot: string }> = {
  online: { label: "Online", dot: "bg-emerald-500" },
  degraded: { label: "Degraded", dot: "bg-amber-500" },
  offline: { label: "Offline", dot: "bg-red-500" },
  unknown: { label: "Unknown", dot: "bg-slate-500" },
};

function buildSparkline(points: number[]) {
  if (points.length === 0) {
    return "";
  }

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  return points
    .map((value, index) => {
      const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export function AgentStatusCard({ agent, onExpand, expanded = false }: AgentStatusCardProps) {
  const status = statusStyles[agent.status];
  const points = buildSparkline(agent.metrics.requestHistory);

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-3.5 w-3.5 rounded-full ${status.dot}`} />
          <div>
            <h2 className="text-base font-semibold text-foreground">{agent.name}</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{status.label}</p>
          </div>
        </div>
        {onExpand ? (
          <button
            type="button"
            onClick={onExpand}
            className="self-start rounded-full border border-border/80 bg-muted/5 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/10"
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? "Hide details" : "View details"}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5 sm:grid-cols-4">
        <div className="rounded-2xl bg-muted/10 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Requests / min</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{agent.metrics.requestsPerMinute}</p>
        </div>
        <div className="rounded-2xl bg-muted/10 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Success rate</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{(agent.metrics.successRate * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl bg-muted/10 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Avg latency</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{agent.metrics.avgLatency}ms</p>
        </div>
        <div className="rounded-2xl bg-muted/10 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Cost today</p>
          <p className="mt-2 text-lg font-semibold text-foreground">${agent.metrics.costToday.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-muted/5 p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Requests (last hour)</p>
          <span className="text-xs text-muted-foreground">{agent.metrics.requestHistory.length} points</span>
        </div>
        <div className="h-24 overflow-hidden rounded-3xl bg-background px-3 py-4">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {expanded ? (
        <div className="mt-5 rounded-3xl border border-border/70 bg-muted/5 p-4">
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Agent ID:</span> {agent.id}
            </div>
            <div>
              <span className="font-medium text-foreground">Status:</span> {status.label}
            </div>
            <div>
              <span className="font-medium text-foreground">Request history:</span> {agent.metrics.requestHistory.join(", ")}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
