import { useCallback, useEffect, useRef, useState } from "react";

export interface AgentMetrics {
  requestsPerMinute: number;
  successRate: number;
  avgLatency: number;
  costToday: number;
  requestHistory: number[];
}

interface UseAgentMetricsOptions {
  agentId: string;
  refreshInterval?: number;
}

interface UseAgentMetricsResult {
  metrics: AgentMetrics | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

const formatWebSocketUrl = (agentId: string) => {
  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${window.location.host}/api/agents/${encodeURIComponent(agentId)}/metrics`;
};

export function useAgentMetrics({ agentId, refreshInterval = 5000 }: UseAgentMetricsOptions): UseAgentMetricsResult {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/metrics`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
      }
      const data = (await response.json()) as AgentMetrics;
      setMetrics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch metrics"));
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollTimerRef.current = window.setInterval(fetchMetrics, refreshInterval);
  }, [fetchMetrics, refreshInterval]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(formatWebSocketUrl(agentId));
      wsRef.current = ws;

      ws.onopen = () => {
        clearTimers();
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as AgentMetrics;
          setMetrics(payload);
          setLastUpdated(new Date());
          setError(null);
          setIsLoading(false);
        } catch (parseError) {
          console.error("useAgentMetrics: invalid websocket payload", parseError);
        }
      };

      ws.onerror = () => {
        setError(new Error("WebSocket connection failed. Falling back to polling."));
        if (!pollTimerRef.current) {
          startPolling();
        }
      };

      ws.onclose = () => {
        if (!pollTimerRef.current) {
          startPolling();
        }
        if (!retryTimerRef.current) {
          retryTimerRef.current = window.setTimeout(() => {
            retryTimerRef.current = null;
            connectWebSocket();
          }, 5000);
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error("WebSocket initialization failed"));
      startPolling();
    }
  }, [agentId, clearTimers, startPolling]);

  useEffect(() => {
    if (!agentId) return undefined;

    setIsLoading(true);
    connectWebSocket();
    void fetchMetrics();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      clearTimers();
    };
  }, [agentId, connectWebSocket, fetchMetrics, clearTimers]);

  return { metrics, isLoading, error, lastUpdated };
}
