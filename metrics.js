// metrics.js
// In-memory metrics for ADE observability

const metrics = {
  startTime: Date.now(),
  decisions: {
    total: 0,
    allow: 0,
    deny: 0,
    block: 0,
    errors: 0,
  },
  latency: {
    total: 0,
    count: 0,
    min: Infinity,
    max: 0,
  },
};

function recordDecision(decision, latencyMs) {
  metrics.decisions.total++;

  const key = decision.toLowerCase();
  if (metrics.decisions[key] !== undefined) {
    metrics.decisions[key]++;
  }

  metrics.latency.total += latencyMs;
  metrics.latency.count++;
  metrics.latency.min = Math.min(metrics.latency.min, latencyMs);
  metrics.latency.max = Math.max(metrics.latency.max, latencyMs);
}

function recordError() {
  metrics.decisions.errors++;
}

function getMetrics() {
  const avgLatency =
    metrics.latency.count > 0
      ? (metrics.latency.total / metrics.latency.count).toFixed(2)
      : 0;

  return {
    uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
    decisions: { ...metrics.decisions },
    latency: {
      avg_ms: parseFloat(avgLatency),
      min_ms: metrics.latency.min === Infinity ? 0 : metrics.latency.min,
      max_ms: metrics.latency.max,
    },
  };
}

function getHealth() {
  return {
    status: "healthy",
    uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
    version: "1.0.0",
  };
}

module.exports = { recordDecision, recordError, getMetrics, getHealth };
