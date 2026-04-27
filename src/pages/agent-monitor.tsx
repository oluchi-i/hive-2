import { useMemo, useState } from "react";
import { Radar, Clock3, Sparkles } from "lucide-react";
import TopBar from "@/components/TopBar";
import { AgentStatusCard, type AgentStatus } from "@/components/AgentStatusCard";
import { useAgentMetrics, type AgentMetrics } from "@/hooks/use-agent-metrics";

interface DemoAgent {
  id: string;
  name: string;
  status: AgentStatus;
  description: string;
  metrics: AgentMetrics;
}

const DEMO_AGENTS: DemoAgent[] = [
  {
    id: "demo-search-agent",
    name: "Research Agent",
    status: "online",
    description: "Tracks trending topics and surfaces high-confidence findings for your team.",
    metrics: {
      requestsPerMinute: 24,
      successRate: 0.92,
      avgLatency: 180,
      costToday: 7.43,
      requestHistory: [12, 15, 18, 16, 21, 24, 30, 27, 29, 24, 22, 24],
    },
  },
  {
    id: "demo-support-agent",
    name: "Support Bot",
    status: "degraded",
    description: "Handles incoming tickets and escalates complex issues when response quality drops.",
    metrics: {
      requestsPerMinute: 14,
      successRate: 0.78,
      avgLatency: 360,
      costToday: 12.15,
      requestHistory: [22, 20, 21, 19, 16, 15, 13, 12, 14, 18, 16, 14],
    },
  },
  {
    id: "demo-recommender-agent",
    name: "Recommender",
    status: "unknown",
    description: "Evaluates agent outputs and flags stale knowledge or model drift for review.",
    metrics: {
      requestsPerMinute: 9,
      successRate: 0.0,
      avgLatency: 48,
      costToday: 3.70,
      requestHistory: [8, 9, 9, 10, 9, 8, 8, 9, 10, 9, 9, 9],
    },
  },
];

function formatRecentUpdate(lastUpdated: Date | null) {
  if (!lastUpdated) return "No live updates yet";
  return lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AgentMonitor() {
  const [selectedAgentId, setSelectedAgentId] = useState(DEMO_AGENTS[0].id);
  const [expanded, setExpanded] = useState(false);
  const selectedAgent = DEMO_AGENTS.find((agent) => agent.id === selectedAgentId) ?? DEMO_AGENTS[0];

  const { metrics, error, lastUpdated } = useAgentMetrics({
    agentId: selectedAgent.id,
    refreshInterval: 8000,
  });

  const currentMetrics = useMemo(
    () => metrics ?? selectedAgent.metrics,
    [metrics, selectedAgent.metrics],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Agent monitoring</p>
            <h1 className="mt-2 text-3xl font-semibold">Live status dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Monitor agent health, request volume, latency, and cost in one place. This demo uses our real-time hook and fallback polling when a WebSocket stream is unavailable.
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Radar className="h-4 w-4 text-primary" />
              <span>Connected to live metrics</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              <span>{formatRecentUpdate(lastUpdated)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-3xl border border-border/70 bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Monitored agents</h2>
                <p className="text-xs text-muted-foreground">Select any agent to inspect its live metrics.</p>
              </div>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>

            <div className="space-y-3">
              {DEMO_AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    setExpanded(false);
                  }}
                  className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                    agent.id === selectedAgentId
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/60 bg-muted/5 hover:border-primary/30 hover:bg-muted/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">{agent.name}</span>
                    <span className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground bg-muted/30">
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{agent.description}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            {error ? (
              <div className="rounded-3xl border border-amber-300/70 bg-amber-100/80 p-4 text-sm text-amber-900">
                Live connector could not establish a WebSocket stream. Showing sample metrics for the selected agent.
              </div>
            ) : null}

            <AgentStatusCard
              agent={{
                id: selectedAgent.id,
                name: selectedAgent.name,
                status: selectedAgent.status,
                metrics: currentMetrics,
              }}
              expanded={expanded}
              onExpand={() => setExpanded((value) => !value)}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-border/70 bg-card p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Success trend</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{(currentMetrics.successRate * 100).toFixed(1)}%</p>
                <p className="mt-2 text-sm text-muted-foreground">Stability remains strong when response quality is above 90%.</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Latency</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{currentMetrics.avgLatency}ms</p>
                <p className="mt-2 text-sm text-muted-foreground">Lower latency helps keep worker throughput responsive.</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Cost outlook</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">${currentMetrics.costToday.toFixed(2)}</p>
                <p className="mt-2 text-sm text-muted-foreground">Daily spend is estimated from live and historical usage.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
